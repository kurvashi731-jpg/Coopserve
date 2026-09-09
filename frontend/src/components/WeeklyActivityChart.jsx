import { useEffect, useState } from "react";
import api from "../api/axios";

export default function WeeklyActivityChart({ workerId }) {
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, active: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workerId) return;
    
    // Fetch bookings to compute live weekly metrics
    api.get(`/bookings/worker-jobs`)
    .then((res) => {
        const bookings = res.data || [];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const recent = bookings.filter(b => new Date(b.createdAt) >= weekAgo);
        
        const completed = recent.filter(b => b.status === "completed").length;
        const active = recent.filter(b => ["accepted", "in_progress"].includes(b.status)).length;
        const cancelled = recent.filter(b => b.status === "cancelled").length;

        setWeeklyStats({ completed, active, cancelled });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [workerId]);

  if (loading) return null;

  const maxVal = Math.max(weeklyStats.completed, weeklyStats.active, weeklyStats.cancelled, 5);

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-heading font-semibold text-base text-slate-800">Weekly Performance Graph</h2>
        <p className="text-xs text-slate-500">Live breakdown of jobs handled over the past 7 days.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2 text-center">
        {/* Completed Column */}
        <div className="space-y-2">
          <div className="h-28 bg-slate-50 rounded-xl flex items-end justify-center p-2 border border-slate-100">
            <div 
              className="w-full bg-emerald-500 rounded-lg transition-all duration-500" 
              style={{ height: `${(weeklyStats.completed / maxVal) * 100}%`, minHeight: '12px' }}
            />
          </div>
          <div>
            <p className="font-heading font-bold text-slate-800">{weeklyStats.completed}</p>
            <p className="text-[11px] text-slate-400 font-medium">Completed</p>
          </div>
        </div>

        {/* Active Column */}
        <div className="space-y-2">
          <div className="h-28 bg-slate-50 rounded-xl flex items-end justify-center p-2 border border-slate-100">
            <div 
              className="w-full bg-blue-500 rounded-lg transition-all duration-500" 
              style={{ height: `${(weeklyStats.active / maxVal) * 100}%`, minHeight: '12px' }}
            />
          </div>
          <div>
            <p className="font-heading font-bold text-slate-800">{weeklyStats.active}</p>
            <p className="text-[11px] text-slate-400 font-medium">Active</p>
          </div>
        </div>

        {/* Cancelled Column */}
        <div className="space-y-2">
          <div className="h-28 bg-slate-50 rounded-xl flex items-end justify-center p-2 border border-slate-100">
            <div 
              className="w-full bg-rose-500 rounded-lg transition-all duration-500" 
              style={{ height: `${(weeklyStats.cancelled / maxVal) * 100}%`, minHeight: '12px' }}
            />
          </div>
          <div>
            <p className="font-heading font-bold text-slate-800">{weeklyStats.cancelled}</p>
            <p className="text-[11px] text-slate-400 font-medium">Cancelled</p>
          </div>
        </div>
      </div>
    </div>
  );
}