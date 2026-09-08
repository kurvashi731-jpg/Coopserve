export default function LedgerRow({ transaction, showWorkerName = false }) {
  const { grossAmount, welfareFundContribution, workerFeeShare, workerPayout } = transaction;
  const welfarePct = Math.round((welfareFundContribution / grossAmount) * 100);
  const payoutPct = 100 - welfarePct;

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-3">
        <div>
          {showWorkerName && (
            <p className="font-medium text-slate-800">{transaction.workerId?.userId?.name || "Worker"}</p>
          )}
          <p className="text-xs text-slate-500">
            {transaction.bookingId?.category || "Service"} ·{" "}
            {new Date(transaction.createdAt).toLocaleDateString()}
          </p>
        </div>
        <p className="font-heading font-semibold text-slate-800">₹{grossAmount}</p>
      </div>

      <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 mb-2">
        <div className="bg-primary" style={{ width: `${payoutPct}%` }} title="Worker payout" />
        <div className="bg-accent" style={{ width: `${welfarePct}%` }} title="Welfare fund" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Worker Payout</p>
          <p className="font-semibold text-primary">₹{workerPayout}</p>
        </div>
        <div>
          <p className="text-slate-400">Welfare Fund</p>
          <p className="font-semibold text-accent">₹{welfareFundContribution}</p>
        </div>
        <div>
          <p className="text-slate-400">Fee Bonus Included</p>
          <p className="font-semibold text-slate-600">₹{workerFeeShare}</p>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-2">No platform cut — the fee is fully shared between the worker and the welfare fund.</p>
    </div>
  );
}
