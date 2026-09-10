import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Phone, Briefcase, ShieldCheck } from "lucide-react";
import api from "../api/axios";
import { VerifiedBadge, TrustScoreBadge, IdVerifiedBadge } from "../components/Badge";
import LiveMap from "../components/LiveMap";
import { useAuth } from "../context/AuthContext";

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function WorkerProfile() {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ledgerData, setLedgerData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [myCoords, setMyCoords] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/workers/${id}`).then((res) => setWorker(res.data));
    api.get(`/reviews/worker/${id}`).then((res) => setReviews(res.data));

    api.get(`/ledger/worker/${id}`).then((res) => setLedgerData(res.data)).catch(() => {});
    api.get(`/bookings/worker-jobs`).then((res) => setBookings(res.data)).catch(() => {});

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 8000 }
      );
    }
  }, [id]);

  if (!worker) return <div className="max-w-2xl mx-auto px-4 py-10 text-slate-400">Loading...</div>;

  const photo = worker.userId?.photoUrl || `https://i.pravatar.cc/150?u=${worker._id}`;
  const loc = worker.userId?.location;
  const hasLocation = loc?.lat != null && loc?.lng != null;
  const distance = hasLocation && myCoords ? Math.round(distanceKm(myCoords.lat, myCoords.lng, loc.lat, loc.lng) * 10) / 10 : null;

  const pastWeekBookings = bookings.filter((b) => {
    const jobDate = new Date(b.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return jobDate >= weekAgo;
  });
  const weeklyCompleted = pastWeekBookings.filter((b) => b.status === "completed").length;
  const weeklyAccepted = pastWeekBookings.filter((b) => b.status === "accepted" || b.status === "in_progress").length;
  const weeklyCancelled = pastWeekBookings.filter((b) => b.status === "cancelled").length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5">
      <div className="card flex gap-4 items-start">
        <img src={photo} alt={worker.userId?.name} className="w-20 h-20 rounded-full object-cover" />
        <div className="flex-1">
          <h1 className="font-heading text-xl font-semibold">{worker.userId?.name}</h1>
          <p className="text-sm text-slate-500 mb-2">{worker.category?.join(", ")} · {worker.cooperativeId?.name}</p>

          <div className="flex gap-2 items-center flex-wrap mb-2">
            <VerifiedBadge verified={worker.verified} />
            <IdVerifiedBadge verified={worker.idVerified} />
            <TrustScoreBadge score={worker.trustScore} />
            <span className="flex items-center gap-1 text-sm text-slate-600">
              <Star size={14} className="fill-accent text-accent" /> {worker.avgRating?.toFixed(1)} ({worker.totalRatings} ratings)
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1 mt-2 pt-2 border-t border-slate-100">
            {worker.userId?.phone && (
              <p className="flex items-center gap-1.5 font-medium text-slate-700">
                <Phone size={13} className="text-primary" /> {worker.userId.phone}
              </p>
            )}
            {worker.idVerified && (
              <p className="flex items-center gap-1.5 text-slate-500">
                <ShieldCheck size={13} className="text-emerald-600" /> ID Verified — ending in {worker.aadharLast4 || "****"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-slate-50 border border-slate-200/60">
        <h2 className="font-heading font-semibold mb-3 flex items-center gap-2 text-slate-800">
          <Briefcase size={16} className="text-primary" /> Work History &amp; Total Earnings
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400">Total Jobs Done</p>
            <p className="font-heading font-bold text-lg text-primary">{worker.totalJobs || 0}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400">Total Income</p>
            <p className="font-heading font-bold text-lg text-emerald-600">₹{ledgerData?.totals?.workerPayout || 0}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400">Welfare Fund Contrib.</p>
            <p className="font-heading font-bold text-lg text-accent">₹{ledgerData?.totals?.welfareFundContribution || 0}</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-100">
          <p className="text-xs font-medium text-slate-700 mb-2">Past 7 Days Activity Breakdown</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg">
              <span className="block font-bold text-sm">{weeklyCompleted}</span> Completed
            </div>
            <div className="bg-blue-50 text-blue-700 p-2 rounded-lg">
              <span className="block font-bold text-sm">{weeklyAccepted}</span> Active/Accepted
            </div>
            <div className="bg-rose-50 text-rose-700 p-2 rounded-lg">
              <span className="block font-bold text-sm">{weeklyCancelled}</span> Cancelled
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-heading font-semibold mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-primary" /> Location
        </h2>
        {worker.userId?.address && <p className="text-sm text-slate-600 mb-3">{worker.userId.address}</p>}
        {distance != null && (
          <p className="text-sm font-medium text-primary mb-3">{distance} km from you</p>
        )}
        {hasLocation ? (
          <LiveMap markers={[{ position: [loc.lat, loc.lng], label: worker.userId?.name, variant: "worker" }]} height={200} />
        ) : (
          <p className="text-sm text-slate-400">This worker hasn't shared a precise location yet.</p>
        )}
      </div>

      <div className="card">
        <h2 className="font-heading font-semibold mb-2">About</h2>
        <p className="text-sm text-slate-600 mb-3">{worker.bio}</p>
        {worker.experienceYears > 0 && (
          <p className="text-sm text-slate-600 mb-2">
            <span className="font-medium text-slate-700">{worker.experienceYears} years</span> of experience
          </p>
        )}
        {worker.portfolioNote && (
          <div className="bg-slate-50 rounded-xl p-3 mb-3">
            <p className="text-xs font-medium text-slate-500 mb-1">Portfolio</p>
            <p className="text-sm text-slate-600">{worker.portfolioNote}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-3">
          {worker.skills?.map((s) => (
            <span key={s} className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full">{s}</span>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          Price range: <span className="font-medium text-slate-700">₹{worker.priceRange?.min} – ₹{worker.priceRange?.max}</span>
        </p>
      </div>

      <div className="card">
        <h2 className="font-heading font-semibold mb-3">Reviews ({reviews.length})</h2>
        {reviews.length === 0 && <p className="text-sm text-slate-400">No reviews yet.</p>}
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="border-b border-slate-100 pb-3 last:border-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{r.customerId?.name}</span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Star size={12} className="fill-accent text-accent" /> {r.rating}
                </span>
              </div>
              <p className="text-sm text-slate-600">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {user?.role === "customer" && (
        <button onClick={() => navigate(`/book/${worker._id}`)} className="btn-primary w-full">
          Book Now
        </button>
      )}
    </div>
  );
}
