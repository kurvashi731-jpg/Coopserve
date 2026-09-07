import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import api from "../api/axios";
import { VerifiedBadge, TrustScoreBadge, IdVerifiedBadge } from "../components/Badge";

const STATUS_COLORS = {
  requested: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function WorkerDashboard() {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aadhar, setAadhar] = useState("");
  const [submittingAadhar, setSubmittingAadhar] = useState(false);

  const loadProfile = () => api.get("/workers/me/profile").then((res) => setProfile(res.data));

  useEffect(() => {
    Promise.all([api.get("/workers/me/profile"), api.get("/bookings/worker-jobs")]).then(([p, j]) => {
      setProfile(p.data);
      setJobs(j.data);
      setLoading(false);
    });
  }, []);

  const submitAadhar = async (e) => {
    e.preventDefault();
    setSubmittingAadhar(true);
    try {
      await api.patch("/workers/me/aadhar", { aadharNumber: aadhar });
      toast.success("Aadhaar submitted — awaiting cooperative admin confirmation");
      setAadhar("");
      loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit Aadhaar");
    } finally {
      setSubmittingAadhar(false);
    }
  };

  const activeJobs = jobs.filter((j) => ["requested", "accepted", "in_progress"].includes(j.status));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {profile && (
        <div className="card flex items-center gap-4 mb-5">
          <img src={profile.userId?.photoUrl} className="w-16 h-16 rounded-full object-cover" alt="" />
          <div className="flex-1">
            <h1 className="font-heading text-lg font-semibold">{profile.userId?.name}</h1>
            <p className="text-sm text-slate-500 mb-1">{profile.cooperativeId?.name}</p>
            <div className="flex gap-2 flex-wrap">
              <VerifiedBadge verified={profile.verified} />
              <IdVerifiedBadge verified={profile.idVerified} />
              <TrustScoreBadge score={profile.trustScore} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-heading font-bold text-primary">{profile.totalJobs}</p>
            <p className="text-xs text-slate-400">jobs done</p>
          </div>
        </div>
      )}

      {!profile?.verified && (
        <div className="bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-xl mb-5">
          ⏳ Your profile is pending verification by your cooperative admin. You can still receive bookings once verified.
        </div>
      )}

      {profile && !profile.idVerified && (
        <div className="card mb-5">
          <h2 className="font-heading font-semibold mb-1 flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" /> Verify your identity
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            {profile.aadharLast4
              ? `Aadhaar ending in ${profile.aadharLast4} submitted — waiting for your cooperative admin to confirm it against your card.`
              : "Add your Aadhaar number so your cooperative admin can confirm your identity. This builds customer trust — we only ever store the last 4 digits, never the full number."}
          </p>
          <form onSubmit={submitAadhar} className="flex gap-2">
            <input
              type="text" inputMode="numeric" maxLength={12} placeholder="12-digit Aadhaar number"
              className="input flex-1" value={aadhar} onChange={(e) => setAadhar(e.target.value.replace(/\D/g, ""))}
              required pattern="\d{12}"
            />
            <button type="submit" disabled={submittingAadhar} className="btn-primary whitespace-nowrap">
              {submittingAadhar ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      )}

      <h2 className="font-heading font-semibold mb-3">Active Jobs ({activeJobs.length})</h2>
      {loading ? (
        <div className="card h-20 animate-pulse bg-slate-100" />
      ) : activeJobs.length === 0 ? (
        <p className="text-slate-400 text-sm mb-6">No active jobs right now.</p>
      ) : (
        <div className="space-y-3 mb-6">
          {activeJobs.map((j) => (
            <Link key={j._id} to={`/worker/job/${j._id}`} className="card flex items-center justify-between hover:scale-[1.01] transition">
              <div>
                <p className="font-medium text-slate-800">{j.customerId?.name}</p>
                <p className="text-xs text-slate-500">{j.category} · {new Date(j.scheduledAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">₹{j.amount}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[j.status]}`}>
                  {j.status.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
