import mongoose from "mongoose";

const ledgerTransactionSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: "Cooperative", required: true },
    grossAmount: { type: Number, required: true },
    feePool: { type: Number, required: true },
    welfareFundContribution: { type: Number, required: true },
    workerFeeShare: { type: Number, required: true },
    workerPayout: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("LedgerTransaction", ledgerTransactionSchema);
