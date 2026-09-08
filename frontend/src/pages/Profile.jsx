import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, ShieldCheck, Briefcase, CalendarClock } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { VerifiedBadge, TrustScoreBadge, IdVerifiedBadge } from "../components/Badge";
import WorkerPerformanceChart from "../components/WorkerPerformanceChart";

const STATUS_COLORS = {
  requested: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/profile")
      .then((res) => {
        setProfileData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-slate-400">Loading profile...</div>;
  }

  const isWorker = user?.role === "worker";
  const isCustomer = user?.role === "customer";
  const displayName = profileData?.name || user?.name;
  const roleLabel = user?.role?.replace("coopAdmin", "Cooperative Admin");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5">
      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center font-heading font-bold text-xl flex-shrink-0">
            {getInitials(displayName)}
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-semibold truncate">{displayName}</h1>
            <span className="inline-block text-xs bg-white/20 px-3 py-1 rounded-full font-medium capitalize mt-1">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/20 text-sm">
          <p className="flex items-center gap-2 text-white/90">
            <Mail size={14} /> {profileData?.email || user?.email}
          </p>
          <p className="flex items-center gap-2 text-white/90">
            <Phone size={14} /> {profileData?.phone || "Not provided"}
          </p>
          {profileData?.address && (
            <p className="flex items-center gap-2 text-white/90 md:col-span-2">
              <MapPin size={14} /> {profileData.address}
            </p>
          )}
        </div>
      </div>

      {isWorker && profileData?.workerProfile && (
        <div className="card bg-slate-50 border border-slate-200/60 space-y-4">
          <h2 className="font-heading font-semibold text-slate-800 flex items-center gap-2">
            <Briefcase size={16} className="text-primary" /> Worker Snapshot
          </h2>

          <div className="flex gap-2 items-center flex-wrap">
            <VerifiedBadge verified={profileData.workerProfile.verified} />
            <IdVerifiedBadge verified={profileData.workerProfile.idVerified} />
            <TrustScoreBadge score={profileData.workerProfile.trustScore} />
          </div>

          {profileData.workerProfile.idVerified && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-600" /> Aadhaar Verified
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-400">Total Jobs Done</p>
              <p className="font-heading font-bold text-lg text-primary">{profileData.workerProfile.totalJobs || 0}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-400">Total Income</p>
              <p className="font-heading font-bold text-lg text-emerald-600">₹{profileData.workerEarnings?.totals?.workerPayout || 0}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-400">Society Contribution</p>
              <p className="font-heading font-bold text-lg text-accent">₹{profileData.workerEarnings?.totals?.welfareFundContribution || 0}</p>
            </div>
          </div>

          <WorkerPerformanceChart workerId={profileData.workerProfile._id} />
        </div>
      )}

      {isCustomer && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-base text-slate-800 flex items-center gap-2">
            <CalendarClock size={16} className="text-primary" /> Your Booking History ({profileData?.bookings?.length || 0})
          </h2>
          {(!profileData?.bookings || profileData.bookings.length === 0) ? (
            <div className="card text-center py-8 text-slate-400 text-sm">
              You haven't booked any services yet.
            </div>
          ) : (
            <div className="space-y-3">
              {profileData.bookings.map((b) => (
                <div key={b._id} className="card flex justify-between items-center text-sm hover:scale-[1.01] transition">
                  <div>
                    <p className="font-medium text-slate-800">{b.category}</p>
                    <p className="text-xs text-slate-500">{new Date(b.scheduledAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-semibold text-slate-800 mb-1">₹{b.amount}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[b.status] || "bg-slate-100 text-slate-600"}`}>
                      {b.status?.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
