import { ShieldCheck, Star, BadgeCheck } from "lucide-react";

export function VerifiedBadge({ verified }) {
  if (!verified) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
      <ShieldCheck size={13} /> Coop Verified
    </span>
  );
}

export function IdVerifiedBadge({ verified }) {
  if (!verified) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
      <BadgeCheck size={13} /> ID Verified
    </span>
  );
}

export function TrustScoreBadge({ score }) {
  const color = score >= 80 ? "bg-green-100 text-green-700" : score >= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${color}`}>
      Trust {score}
    </span>
  );
}

export function RatingBadge({ rating }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
      <Star size={13} className="fill-accent text-accent" /> {rating?.toFixed ? rating.toFixed(1) : rating}
    </span>
  );
}
