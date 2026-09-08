import express from "express";
import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import Cooperative from "../models/Cooperative.js";
import LedgerTransaction from "../models/LedgerTransaction.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// POST /api/bookings  (customer creates a booking)
router.post("/", protect, authorize("customer"), async (req, res) => {
  try {
    const { workerId, category, scheduledAt, address, notes, amount, destination } = req.body;
    if (!workerId || !category || !scheduledAt || !address || !amount) {
      return res.status(400).json({ message: "Missing required booking fields" });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    const booking = await Booking.create({
      customerId: req.user.id,
      workerId,
      category,
      scheduledAt,
      address,
      notes: notes || "",
      amount,
      destination: destination && destination.lat ? destination : undefined,
    });

    // Fair rotation: mark this worker as just-matched so they move to the back
    // of the queue for future nearby matching, giving other cooperative
    // members an equal chance at the next job.
    worker.lastMatchedAt = new Date();
    await worker.save();

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/mine  (customer's bookings)
router.get("/mine", protect, authorize("customer"), async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.id })
      .populate({ path: "workerId", populate: { path: "userId", select: "name photoUrl phone" } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/worker-jobs  (worker's incoming/active jobs)
router.get("/worker-jobs", protect, authorize("worker"), async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.user.id });
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const bookings = await Booking.find({ workerId: worker._id })
      .populate("customerId", "name phone address")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customerId", "name phone address")
      .populate({ path: "workerId", populate: { path: "userId", select: "name phone photoUrl" } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/status  (worker updates status: accepted / in_progress / completed / cancelled)
router.patch("/:id/status", protect, authorize("worker"), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["accepted", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const worker = await Worker.findOne({ userId: req.user.id });
    if (!worker || String(booking.workerId) !== String(worker._id)) {
      return res.status(403).json({ message: "Not your booking" });
    }

    booking.status = status;

    if (status === "completed") {
      booking.completedAt = new Date();

      // --- Transparent Commission Ledger generation ---
      // No cut is retained by the platform. The cooperative fee pool is fully
      // redistributed: part to the welfare fund (society), and the rest
      // returned directly to the worker as a bonus on top of their base pay.
      const coop = await Cooperative.findById(worker.cooperativeId);
      const grossAmount = booking.amount;
      const feePool = Math.round(grossAmount * coop.commissionRate * 100) / 100;
      const welfareFundContribution = Math.round(feePool * coop.welfareShare * 100) / 100;
      const workerFeeShare = Math.round((feePool - welfareFundContribution) * 100) / 100;
      const workerPayout = Math.round((grossAmount - welfareFundContribution) * 100) / 100;

      await LedgerTransaction.create({
        bookingId: booking._id,
        workerId: worker._id,
        cooperativeId: coop._id,
        grossAmount,
        feePool,
        welfareFundContribution,
        workerFeeShare,
        workerPayout,
      });

      coop.welfareFundBalance += welfareFundContribution;
      await coop.save();

      worker.totalJobs += 1;
      await worker.save();
    }

    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/location  (worker pushes live location while heading to/at the job)
router.patch("/:id/location", protect, authorize("worker"), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ message: "lat and lng must be numbers" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const worker = await Worker.findOne({ userId: req.user.id });
    if (!worker || String(booking.workerId) !== String(worker._id)) {
      return res.status(403).json({ message: "Not your booking" });
    }
    if (!["accepted", "in_progress"].includes(booking.status)) {
      return res.status(400).json({ message: "Location can only be shared for active bookings" });
    }

    booking.workerLiveLocation = { lat, lng, updatedAt: new Date() };
    await booking.save();

    res.json({ message: "Location updated", workerLiveLocation: booking.workerLiveLocation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;