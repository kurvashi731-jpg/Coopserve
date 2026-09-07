import express from "express";
import ServiceCategory from "../models/ServiceCategory.js";

const router = express.Router();

// GET /api/categories
router.get("/", async (req, res) => {
  try {
    const categories = await ServiceCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
