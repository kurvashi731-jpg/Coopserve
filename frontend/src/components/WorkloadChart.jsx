import { useEffect, useState } from "react";
import api from "../api/axios";

export default function WorkloadChart() {
  const [bookings, setBookings] = useState([]);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bookings/worker-jobs")
      .then((res) => setBookings(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-xs text-slate-400 py-2">Loading workload...</div>;

  const since = new Date();
  if (period === "week") since.setDate(since.getDate() - 7);
  else since.setMonth(since.getMonth() - 1);

  const inPeriod = bookings.filter((b) => new Date(b.createdAt) >= since);
  const completed = inPeriod.filter((b) => b.status === "completed").length;
  const pending = inPeriod.filter((b) => ["requested", "accepted", "in_progress"].includes(b.status)).length;
  const received = inPeriod.length;
  const maxVal = Math.max(received, completed, pending, 3);

  const bars = [
    { label: "Received", value: received, color: "bg-primary" },
    { label: "Completed", value: completed, color: "bg-emerald-500" },
    { label: "Left to Complete", value: pending, color: "bg-amber-500" },
  ];

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-semibold text-base text-slate-800">Workload</h2>
          <p className="text-xs text-slate-500">Jobs received vs completed vs still pending.</p>
        </div>
        <div className="flex gap-1">
          {["week", "month"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                period === p ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {p}ly
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1 text-center">
        {bars.map((b) => (
          <div key={b.label} className="space-y-2">
            <div className="h-24 bg-slate-50 rounded-xl flex items-end justify-center p-2 border border-slate-100">
              <div
                className={`w-full rounded-lg transition-all duration-500 ${b.color}`}
                style={{ height: `${(b.value / maxVal) * 100}%`, minHeight: "10px" }}
              />
            </div>
            <div>
              <p className="font-heading font-bold text-slate-800">{b.value}</p>
              <p className="text-[11px] text-slate-400 font-medium">{b.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
