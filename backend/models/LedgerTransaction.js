import mongoose from "mongoose";

// This model powers the "Transparent Commission Ledger" - the standout feature.
// Every completed booking generates exactly one ledger entry showing the full
// money split: gross amount -> platform fee -> cooperative welfare fund -> worker payout.
const ledgerTransactionSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: "Cooperative", required: true },
    grossAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    welfareFundContribution: { type: Number, required: true },
    workerPayout: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("LedgerTransaction", ledgerTransactionSchema);
