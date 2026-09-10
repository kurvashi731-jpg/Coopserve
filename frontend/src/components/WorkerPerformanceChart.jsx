import { useEffect, useState } from "react";
import api from "../api/axios";

export default function WorkerPerformanceChart({ workerId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workerId) {
      setLoading(false);
      return;
    }

    api.get(`/ledger/worker/${workerId}`)
      .then((res) => {
        setTransactions(res.data?.transactions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [workerId]);

  if (loading) return <div className="text-xs text-slate-400 py-2">Loading performance history...</div>;

  return (
    <div className="bg-white border border-slate-200/60 p-4 rounded-xl space-y-3">
      <div>
        <h3 className="font-heading font-semibold text-sm text-slate-800">Historical Job Ledger</h3>
        <p className="text-[11px] text-slate-500">Record of completed tasks and direct payouts.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="pb-1.5 font-medium">Work</th>
              <th className="pb-1.5 font-medium text-right">Gross</th>
              <th className="pb-1.5 font-medium text-right">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-3 text-center text-slate-400">No ledger transactions found.</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx._id}>
                  <td className="py-2">
                    <p className="font-medium text-slate-800">{tx.bookingId?.category || "Service"}</p>
                    <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="py-2 text-right font-semibold">₹{tx.grossAmount}</td>
                  <td className="py-2 text-right font-semibold text-emerald-600">₹{tx.workerPayout}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
