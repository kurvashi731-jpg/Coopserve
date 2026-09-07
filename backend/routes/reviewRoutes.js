import express from "express";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// POST /api/reviews  (customer reviews a completed booking)
router.post("/", protect, authorize("customer"), async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    if (!bookingId || !rating) return res.status(400).json({ message: "bookingId and rating are required" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (String(booking.customerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not your booking" });
    }
    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Can only review completed bookings" });
    }

    const existing = await Review.findOne({ bookingId });
    if (existing) return res.status(409).json({ message: "Booking already reviewed" });

    const review = await Review.create({
      bookingId,
      customerId: req.user.id,
      workerId: booking.workerId,
      rating,
      comment: comment || "",
    });

    // Update worker's rolling average rating + trust score
    const worker = await Worker.findById(booking.workerId);
    const newTotal = worker.totalRatings + 1;
    const newAvg = (worker.avgRating * worker.totalRatings + rating) / newTotal;
    worker.avgRating = Math.round(newAvg * 10) / 10;
    worker.totalRatings = newTotal;
    worker.trustScore = Math.min(100, Math.round(worker.trustScore * 0.9 + newAvg * 20 * 0.1));
    await worker.save();

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/worker/:workerId
router.get("/worker/:workerId", async (req, res) => {
  try {
    const reviews = await Review.find({ workerId: req.params.workerId })
      .populate("customerId", "name photoUrl")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
