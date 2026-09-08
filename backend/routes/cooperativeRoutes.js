import express from "express";
import Cooperative from "../models/Cooperative.js";
import Worker from "../models/Worker.js";
import LedgerTransaction from "../models/LedgerTransaction.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// GET /api/cooperatives  (public - used at registration time for workers to pick one)
router.get("/", async (req, res) => {
  try {
    const coops = await Cooperative.find().select("name description commissionRate");
    res.json(coops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cooperatives/mine  (coopAdmin dashboard summary)
router.get("/mine", protect, authorize("coopAdmin"), async (req, res) => {
  try {
    const coop = await Cooperative.findOne({ adminUserId: req.user.id });
    if (!coop) return res.status(404).json({ message: "Cooperative not found" });

    const workers = await Worker.find({ cooperativeId: coop._id }).populate("userId", "name email phone photoUrl");
    const pendingCount = workers.filter((w) => !w.verified).length;

    res.json({ cooperative: coop, workers, pendingCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/cooperatives/verify-worker/:workerId  (coopAdmin approves a worker)
router.patch("/verify-worker/:workerId", protect, authorize("coopAdmin"), async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.workerId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    const coop = await Cooperative.findOne({ adminUserId: req.user.id });
    if (!coop || String(worker.cooperativeId) !== String(coop._id)) {
      return res.status(403).json({ message: "This worker is not in your cooperative" });
    }

    worker.verified = req.body.verified !== undefined ? req.body.verified : true;
    worker.trustScore = Math.min(100, worker.trustScore + 15);
    await worker.save();

    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/cooperatives/verify-id/:workerId  (coopAdmin confirms Aadhaar ID match)
router.patch("/verify-id/:workerId", protect, authorize("coopAdmin"), async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.workerId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    if (!worker.aadharLast4) return res.status(400).json({ message: "Worker has not submitted an Aadhaar number yet" });

    const coop = await Cooperative.findOne({ adminUserId: req.user.id });
    if (!coop || String(worker.cooperativeId) !== String(coop._id)) {
      return res.status(403).json({ message: "This worker is not in your cooperative" });
    }

    worker.idVerified = true;
    worker.trustScore = Math.min(100, worker.trustScore + 10);
    await worker.save();

    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cooperatives/ledger  (Transparency View - the standout feature)
router.get("/ledger", protect, authorize("coopAdmin"), async (req, res) => {
  try {
    const coop = await Cooperative.findOne({ adminUserId: req.user.id });
    if (!coop) return res.status(404).json({ message: "Cooperative not found" });

    const transactions = await LedgerTransaction.find({ cooperativeId: coop._id })
      .populate({ path: "workerId", populate: { path: "userId", select: "name" } })
      .sort({ createdAt: -1 });

    const totals = transactions.reduce(
      (acc, t) => {
        acc.grossAmount += t.grossAmount;
        acc.feePool += t.feePool;
        acc.welfareFundContribution += t.welfareFundContribution;
        acc.workerFeeShare += t.workerFeeShare;
        acc.workerPayout += t.workerPayout;
        return acc;
      },
      { grossAmount: 0, feePool: 0, welfareFundContribution: 0, workerFeeShare: 0, workerPayout: 0 }
    );

    res.json({ cooperative: coop, transactions, totals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
