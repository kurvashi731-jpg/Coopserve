import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: "Cooperative", required: true },
    category: [{ type: String, required: true }],
    skills: [{ type: String }],
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    bio: { type: String, default: "" },
    verified: { type: Boolean, default: false },
    // Aadhaar-based identity verification. We deliberately never store the full
    // 12-digit number — only the last 4 digits, for display/matching purposes.
    // idVerified is set true only after the cooperative admin manually confirms
    // the ID against the submitted number (no live UIDAI API access in this MVP).
    aadharLast4: { type: String, default: "" },
    idVerified: { type: Boolean, default: false },
    trustScore: { type: Number, default: 60, min: 0, max: 100 },
    avgRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    // Fair rotation: the last time this worker received a booking. Workers who
    // have gone longest without a job (or never had one - null sorts first)
    // are prioritized in nearby matching, so jobs spread evenly across the
    // cooperative instead of concentrating on a few top-rated workers.
    lastMatchedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Worker", workerSchema);
