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
    experienceYears: { type: Number, default: 0 },
    portfolioNote: { type: String, default: "" },
    verified: { type: Boolean, default: false },
    aadharLast4: { type: String, default: "" },
    idVerified: { type: Boolean, default: false },
    trustScore: { type: Number, default: 60, min: 0, max: 100 },
    avgRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    lastMatchedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Worker", workerSchema);
