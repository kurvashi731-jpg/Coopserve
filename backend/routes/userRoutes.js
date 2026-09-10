import express from "express";
import User from "../models/User.js";
import Worker from "../models/Worker.js";
import Booking from "../models/Booking.js";
import LedgerTransaction from "../models/LedgerTransaction.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    const result = { ...user.toObject() };

    if (user.role === "worker") {
      const workerProfile = await Worker.findOne({ userId: user._id }).populate("cooperativeId", "name");
      result.workerProfile = workerProfile;
      if (workerProfile) {
        const transactions = await LedgerTransaction.find({ workerId: workerProfile._id });
        const totals = transactions.reduce(
          (acc, t) => {
            acc.workerPayout += t.workerPayout;
            acc.welfareFundContribution += t.welfareFundContribution;
            return acc;
          },
          { workerPayout: 0, welfareFundContribution: 0 }
        );
        result.workerEarnings = { totals };
      }
    }

    if (user.role === "customer") {
      result.bookings = await Booking.find({ customerId: user._id }).sort({ createdAt: -1 });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
