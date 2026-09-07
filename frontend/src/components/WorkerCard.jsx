import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { VerifiedBadge, TrustScoreBadge, RatingBadge, IdVerifiedBadge } from "./Badge";

export default function WorkerCard({ worker }) {
  const photo = worker.userId?.photoUrl || `https://i.pravatar.cc/150?u=${worker._id}`;
  return (
    <Link
      to={`/workers/${worker._id}`}
      className="card flex items-center gap-4 hover:scale-[1.02] transition cursor-pointer"
    >
      <img src={photo} alt={worker.userId?.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading font-semibold text-slate-800 truncate">{worker.userId?.name}</h3>
          <RatingBadge rating={worker.avgRating} />
        </div>
        <p className="text-sm text-slate-500 truncate">{worker.category?.join(", ")}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <VerifiedBadge verified={worker.verified} />
          <IdVerifiedBadge verified={worker.idVerified} />
          <TrustScoreBadge score={worker.trustScore} />
          <span className="text-xs text-slate-500">₹{worker.priceRange?.min}–₹{worker.priceRange?.max}</span>
          {worker.distanceKm != null && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <MapPin size={12} /> {worker.distanceKm} km away
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
