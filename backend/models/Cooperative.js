import mongoose from "mongoose";

const cooperativeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    memberWorkerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Worker" }],
    welfareFundBalance: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0.1 }, // 10% platform fee
    welfareShare: { type: Number, default: 0.4 }, // 40% of the fee goes to welfare fund, rest is platform upkeep
  },
  { timestamps: true }
);

export default mongoose.model("Cooperative", cooperativeSchema);
