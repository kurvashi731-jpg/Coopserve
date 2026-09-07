import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    category: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    address: { type: String, required: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["requested", "accepted", "in_progress", "completed", "cancelled"],
      default: "requested",
    },
    amount: { type: Number, required: true },
    completedAt: { type: Date, default: null },
    // Destination coordinates for this specific job (customer's service address).
    destination: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    // Worker's live location while travelling to / working on this job.
    // Updated periodically by the worker's app while status is accepted/in_progress.
    workerLiveLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
