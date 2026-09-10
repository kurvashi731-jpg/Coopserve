import express from "express";
import Worker from "../models/Worker.js";
import Cooperative from "../models/Cooperative.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RADIUS_STEPS_KM = [5, 15, 50, 150];

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

        const noLocation = withDistance.filter((w) => w.distanceKm == null);

        nearby.sort((a, b) => {
          const aTime = a.lastMatchedAt ? new Date(a.lastMatchedAt).getTime() : 0;
          const bTime = b.lastMatchedAt ? new Date(b.lastMatchedAt).getTime() : 0;
          if (aTime !== bTime) return aTime - bTime;
          return a.distanceKm - b.distanceKm;
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

router.patch("/me/update", protect, authorize("worker"), async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.user.id });
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const { category, skills, priceRange, bio, available, experienceYears, portfolioNote } = req.body;
    if (category) worker.category = category;
    if (skills) worker.skills = skills;
    if (priceRange) worker.priceRange = priceRange;
    if (bio !== undefined) worker.bio = bio;
    if (available !== undefined) worker.available = available;
    if (experienceYears !== undefined) worker.experienceYears = experienceYears;
    if (portfolioNote !== undefined) worker.portfolioNote = portfolioNote;

    await worker.save();
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/me/switch-cooperative", protect, authorize("worker"), async (req, res) => {
  try {
    const { cooperativeId } = req.body;
    if (!cooperativeId) return res.status(400).json({ message: "cooperativeId is required" });

    const worker = await Worker.findOne({ userId: req.user.id });
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const newCoop = await Cooperative.findById(cooperativeId);
    if (!newCoop) return res.status(404).json({ message: "Cooperative not found" });

    if (String(worker.cooperativeId) === String(newCoop._id)) {
      return res.status(400).json({ message: "You're already a member of this cooperative" });
    }

    const oldCoop = await Cooperative.findById(worker.cooperativeId);
    if (oldCoop) {
      oldCoop.memberWorkerIds = oldCoop.memberWorkerIds.filter((id) => String(id) !== String(worker._id));
      await oldCoop.save();
    }

    newCoop.memberWorkerIds.push(worker._id);
    await newCoop.save();

    worker.cooperativeId = newCoop._id;
    worker.verified = false;
    await worker.save();

    res.json({ message: `Moved to ${newCoop.name}`, worker });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/me/aadhar", protect, authorize("worker"), async (req, res) => {
  try {
    const { aadharNumber } = req.body;
    if (!aadharNumber || !/^\d{12}$/.test(aadharNumber)) {
      return res.status(400).json({ message: "Enter a valid 12-digit Aadhaar number" });
    }

    const worker = await Worker.findOne({ userId: req.user.id });
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    worker.aadharLast4 = aadharNumber.slice(-4);
    worker.idVerified = false;
    await worker.save();

    res.json({ message: "Aadhaar submitted for verification", aadharLast4: worker.aadharLast4 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
