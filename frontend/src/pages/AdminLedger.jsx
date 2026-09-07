import { useEffect, useState } from "react";
import api from "../api/axios";
import LedgerRow from "../components/LedgerRow";

export default function AdminLedger() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/cooperatives/ledger").then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="max-w-2xl mx-auto px-4 py-10 text-slate-400">Loading...</div>;

  const { cooperative, transactions, totals } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading text-xl font-semibold mb-1">Transparency Ledger</h1>
      <p className="text-slate-500 text-sm mb-5">
        Every rupee earned by {cooperative.name} members, fully visible — no hidden cuts.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card text-center !p-4">
          <p className="text-xs text-slate-400">Total Volume</p>
          <p className="font-heading font-bold text-lg text-primary">₹{totals.grossAmount.toFixed(0)}</p>
        </div>
        <div className="card text-center !p-4">
          <p className="text-xs text-slate-400">Worker Payouts</p>
          <p className="font-heading font-bold text-lg text-primary">₹{totals.workerPayout.toFixed(0)}</p>
        </div>
        <div className="card text-center !p-4">
          <p className="text-xs text-slate-400">Platform Fee</p>
          <p className="font-heading font-bold text-lg text-accent">₹{totals.platformFee.toFixed(0)}</p>
        </div>
        <div className="card text-center !p-4">
          <p className="text-xs text-slate-400">Welfare Fund</p>
          <p className="font-heading font-bold text-lg text-slate-700">₹{totals.welfareFundContribution.toFixed(0)}</p>
        </div>
      </div>

      <h2 className="font-heading font-semibold mb-3">All Transactions</h2>
      {transactions.length === 0 ? (
        <p className="text-slate-400 text-sm">No completed bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => (
            <LedgerRow key={t._id} transaction={t} showWorkerName />
          ))}
        </div>
      )}
    </div>
  );
}
