import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "worker", "coopAdmin"], required: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    photoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
