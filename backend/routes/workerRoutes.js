import express from "express";
import Worker from "../models/Worker.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Haversine formula - distance in km between two lat/lng points
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// To this (strict 5 km limit):
const RADIUS_STEPS_KM = [5];
// GET /api/workers?category=Plumbing&minRating=4&lat=25.6&lng=85.1&sortMode=fair
// sortMode: "fair" (default, rotation-based) | "rating" | "distance"
router.get("/", async (req, res) => {
  try {
    const { category, minRating, search, lat, lng, sortMode = "fair" } = req.query;
    const filter = { available: true };
    if (category) filter.category = category;
    if (minRating) filter.avgRating = { $gte: Number(minRating) };

    let workers = await Worker.find(filter)
      .populate("userId", "name photoUrl address location")
      .populate("cooperativeId", "name");

    if (search) {
      const s = search.toLowerCase();
      workers = workers.filter(
        (w) =>
          w.userId?.name?.toLowerCase().includes(s) ||
          w.skills.some((sk) => sk.toLowerCase().includes(s)) ||
          w.category.some((c) => c.toLowerCase().includes(s))
      );
    }

    let meta = { radiusKm: null, expanded: false, sortMode };

    if (lat && lng) {
      const customerLat = Number(lat);
      const customerLng = Number(lng);

      // Attach distance to every worker that has a saved location
      let withDistance = workers.map((w) => {
        const wObj = w.toObject();
        if (w.userId?.location?.lat != null && w.userId?.location?.lng != null) {
          wObj.distanceKm =
            Math.round(distanceKm(customerLat, customerLng, w.userId.location.lat, w.userId.location.lng) * 10) / 10;
        } else {
          wObj.distanceKm = null;
        }
        return wObj;
      });

      if (sortMode === "distance") {
        workers = withDistance.sort((a, b) => {
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });
      } else if (sortMode === "rating") {
        workers = withDistance.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      } else {
        // FAIR ROTATION: find the smallest radius step that returns at least
        // one worker, so nearby matching stays local when possible but never
        // returns an empty result in low worker-density areas.
        let radiusUsed = RADIUS_STEPS_KM[RADIUS_STEPS_KM.length - 1];
        let nearby = withDistance.filter((w) => w.distanceKm != null && w.distanceKm <= radiusUsed);

        for (const step of RADIUS_STEPS_KM) {
          const candidates = withDistance.filter((w) => w.distanceKm != null && w.distanceKm <= step);
          if (candidates.length > 0) {
            radiusUsed = step;
            nearby = candidates;
            break;
          }
        }

        // Workers with no saved location at all can't be radius-filtered — include
        // them at the end so they're still visible, just not rotation-prioritized.
        const noLocation = withDistance.filter((w) => w.distanceKm == null);

        nearby.sort((a, b) => {
          const aTime = a.lastMatchedAt ? new Date(a.lastMatchedAt).getTime() : 0; // never matched = 0 = goes first
          const bTime = b.lastMatchedAt ? new Date(b.lastMatchedAt).getTime() : 0;
          if (aTime !== bTime) return aTime - bTime; // longest since last job first
          return a.distanceKm - b.distanceKm; // tiebreaker: closer first
        });

        workers = [...nearby, ...noLocation];
        meta = { radiusKm: radiusUsed, expanded: radiusUsed !== RADIUS_STEPS_KM[0], sortMode: "fair" };
      }
    }

    res.json({ workers, meta });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workers/:id  (public profile)
router.get("/:id", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate("userId", "name photoUrl phone address location")
      .populate("cooperativeId", "name description");
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/workers/me  (worker edits own profile)
router.patch("/me/update", protect, authorize("worker"), async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.user.id });
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const { category, skills, priceRange, bio, available } = req.body;
    if (category) worker.category = category;
    if (skills) worker.skills = skills;
    if (priceRange) worker.priceRange = priceRange;
    if (bio !== undefined) worker.bio = bio;
    if (available !== undefined) worker.available = available;

    await worker.save();
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/workers/me/aadhar  (worker submits Aadhaar for ID verification)
// SECURITY: the full number is received here but never saved to the database —
// only the last 4 digits are persisted, and idVerified is reset to false so an
// admin has to manually re-confirm any time the number is changed.
router.patch("/me/aadhar", protect, authorize("worker"), async (req, res) => {
  try {
    const { aadharNumber } = req.body;
    if (!aadharNumber || !/^\d{12}$/.test(aadharNumber)) {
      return res.status(400).json({ message: "Enter a valid 12-digit Aadhaar number" });
    }

    const worker = await Worker.findOne({ userId: req.user.id });
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    worker.aadharLast4 = aadharNumber.slice(-4);
    worker.idVerified = false; // needs fresh admin confirmation
    await worker.save();

    res.json({ message: "Aadhaar submitted for verification", aadharLast4: worker.aadharLast4 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workers/me/profile  (worker's own dashboard profile)
router.get("/me/profile", protect, authorize("worker"), async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.user.id })
      .populate("userId", "name email phone photoUrl")
      .populate("cooperativeId", "name commissionRate");
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
