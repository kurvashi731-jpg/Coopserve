import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import api from "../api/axios";
import { VerifiedBadge, TrustScoreBadge, IdVerifiedBadge } from "../components/Badge";
import LiveMap from "../components/LiveMap";
import { useAuth } from "../context/AuthContext";

// Haversine formula - distance in km between two lat/lng points
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
  const [myCoords, setMyCoords] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/workers/${id}`).then((res) => setWorker(res.data));
    api.get(`/reviews/worker/${id}`).then((res) => setReviews(res.data));
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="card flex gap-4 items-start mb-5">
        <img src={photo} alt={worker.userId?.name} className="w-20 h-20 rounded-full object-cover" />
        <div className="flex-1">
          <h1 className="font-heading text-xl font-semibold">{worker.userId?.name}</h1>
          <p className="text-sm text-slate-500 mb-2">{worker.category?.join(", ")} · {worker.cooperativeId?.name}</p>
          <div className="flex gap-2 items-center flex-wrap">
            <VerifiedBadge verified={worker.verified} />
            <IdVerifiedBadge verified={worker.idVerified} />
            <TrustScoreBadge score={worker.trustScore} />
            <span className="flex items-center gap-1 text-sm text-slate-600">
              <Star size={14} className="fill-accent text-accent" /> {worker.avgRating?.toFixed(1)} ({worker.totalRatings} ratings)
            </span>
          </div>
          {worker.idVerified && worker.aadharLast4 && (
            <p className="text-xs text-slate-400 mt-2">Aadhaar verified · ending in {worker.aadharLast4}</p>
          )}
        </div>
      </div>

      <div className="card mb-5">
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

      <div className="card mb-5">
        <h2 className="font-heading font-semibold mb-2">About</h2>
        <p className="text-sm text-slate-600 mb-3">{worker.bio}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {worker.skills?.map((s) => (
            <span key={s} className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full">{s}</span>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          Price range: <span className="font-medium text-slate-700">₹{worker.priceRange?.min} – ₹{worker.priceRange?.max}</span>
        </p>
      </div>

      <div className="card mb-5">
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