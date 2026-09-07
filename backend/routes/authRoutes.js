import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Worker from "../models/Worker.js";
import Cooperative from "../models/Cooperative.js";

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, address, cooperativeId, category, skills, priceRange, bio } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone: phone || "",
      address: address || "",
    });

    // If registering as a worker, also create the Worker profile
    if (role === "worker") {
      if (!cooperativeId) {
        return res.status(400).json({ message: "Workers must select a cooperative to join" });
      }
      const coop = await Cooperative.findById(cooperativeId);
      if (!coop) return res.status(404).json({ message: "Cooperative not found" });

      const worker = await Worker.create({
        userId: user._id,
        cooperativeId,
        category: category || [],
        skills: skills || [],
        priceRange: priceRange || { min: 0, max: 0 },
        bio: bio || "",
      });

      coop.memberWorkerIds.push(worker._id);
      await coop.save();
    }

    // If registering as coopAdmin, create their cooperative
    if (role === "coopAdmin") {
      await Cooperative.create({
        name: `${name}'s Cooperative`,
        description: "Newly created cooperative",
        adminUserId: user._id,
      });
    }

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
