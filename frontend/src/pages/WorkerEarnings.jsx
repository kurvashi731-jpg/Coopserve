import { useEffect, useState } from "react";
import api from "../api/axios";
import LedgerRow from "../components/LedgerRow";

export default function WorkerEarnings() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/ledger/mine")
      .then((res) => setData(res.data))
      .catch(() => setError(true));
  }, []);

  if (error) return <div className="max-w-2xl mx-auto px-4 py-10 text-red-500">Couldn't load your earnings. Try refreshing.</div>;
  if (!data) return <div className="max-w-2xl mx-auto px-4 py-10 text-slate-400">Loading...</div>;

  const { transactions, totals } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading text-xl font-semibold mb-1">My Earnings</h1>
      <p className="text-slate-500 text-sm mb-5">A fully transparent breakdown of every job's payout.</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center !p-4">
          <p className="text-xs text-slate-400">Total Earned</p>
          <p className="font-heading font-bold text-lg text-primary">₹{totals.grossAmount}</p>
        </div>
        <div className="card text-center !p-4">
          <p className="text-xs text-slate-400">You Received</p>
          <p className="font-heading font-bold text-lg text-primary">₹{totals.workerPayout}</p>
        </div>
        <div className="card text-center !p-4">
          <p className="text-xs text-slate-400">Welfare Fund</p>
          <p className="font-heading font-bold text-lg text-accent">₹{totals.welfareFundContribution}</p>
        </div>
      </div>

      <h2 className="font-heading font-semibold mb-3">Transaction History</h2>
      {transactions.length === 0 ? (
        <p className="text-slate-400 text-sm">No completed jobs yet.</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => (
            <LedgerRow key={t._id} transaction={t} />
          ))}
        </div>
      )}
    </div>
  );
}
