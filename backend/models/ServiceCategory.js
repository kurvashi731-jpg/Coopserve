import mongoose from "mongoose";

const serviceCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    icon: { type: String, default: "Wrench" }, // lucide-react icon name
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceCategory", serviceCategorySchema);
