import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const STATUS_COLORS = {
  requested: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bookings/mine").then((res) => {
      setBookings(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading text-xl font-semibold mb-5">My Bookings</h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-slate-100" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center text-slate-400 py-16">
          No bookings yet. <Link to="/home" className="text-primary font-medium">Browse services</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link key={b._id} to={`/booking/${b._id}`} className="card flex items-center justify-between hover:scale-[1.01] transition">
              <div className="flex items-center gap-3">
                <img
                  src={b.workerId?.userId?.photoUrl || `https://i.pravatar.cc/150?u=${b.workerId?._id}`}
                  className="w-12 h-12 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <p className="font-medium text-slate-800">{b.workerId?.userId?.name}</p>
                  <p className="text-xs text-slate-500">{b.category} · {new Date(b.scheduledAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">₹{b.amount}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status]}`}>
                  {b.status.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
