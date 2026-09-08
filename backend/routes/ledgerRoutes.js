import express from "express";
import LedgerTransaction from "../models/LedgerTransaction.js";
import Worker from "../models/Worker.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// GET /api/ledger/mine  (worker's own earnings + fee breakdown - builds trust)
router.get("/mine", protect, authorize("worker"), async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.user.id });
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const transactions = await LedgerTransaction.find({ workerId: worker._id })
      .populate("bookingId", "category scheduledAt address")
      .sort({ createdAt: -1 });

    const totals = transactions.reduce(
      (acc, t) => {
        acc.grossAmount += t.grossAmount;
        acc.welfareFundContribution += t.welfareFundContribution;
        acc.workerFeeShare += t.workerFeeShare;
        acc.workerPayout += t.workerPayout;
        return acc;
      },
      { grossAmount: 0, welfareFundContribution: 0, workerFeeShare: 0, workerPayout: 0 }
    );

    res.json({ transactions, totals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ledger/worker/:workerId  (used by WorkerProfile and WorkerPerformanceChart)
router.get("/worker/:workerId", protect, async (req, res) => {
  try {
    const { workerId } = req.params;

    const transactions = await LedgerTransaction.find({ workerId })
      .populate("bookingId", "category scheduledAt address")
      .sort({ createdAt: -1 });

    const totals = transactions.reduce(
      (acc, t) => {
        acc.grossAmount += t.grossAmount;
        acc.welfareFundContribution += t.welfareFundContribution;
        acc.workerFeeShare += t.workerFeeShare;
        acc.workerPayout += t.workerPayout;
        return acc;
      },
      { grossAmount: 0, welfareFundContribution: 0, workerFeeShare: 0, workerPayout: 0 }
    );

    res.json({ transactions, totals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
