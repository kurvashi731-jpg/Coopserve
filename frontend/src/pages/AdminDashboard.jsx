import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { VerifiedBadge, TrustScoreBadge, IdVerifiedBadge } from "../components/Badge";

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  const load = () => api.get("/cooperatives/mine").then((res) => setData(res.data));
  useEffect(() => { load(); }, []);

  const verifyWorker = async (workerId) => {
    try {
      await api.patch(`/cooperatives/verify-worker/${workerId}`, { verified: true });
      toast.success("Worker verified!");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
  };

  const confirmId = async (workerId) => {
    try {
      await api.patch(`/cooperatives/verify-id/${workerId}`);
      toast.success("Aadhaar ID confirmed!");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "ID confirmation failed");
    }
  };

  if (!data) return <div className="max-w-2xl mx-auto px-4 py-10 text-slate-400">Loading...</div>;

  const { cooperative, workers, pendingCount } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading text-xl font-semibold mb-1">{cooperative.name}</h1>
      <p className="text-slate-500 text-sm mb-5">{cooperative.description}</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center !p-4">
          <p className="text-xs text-slate-400">Members</p>
          <p className="font-heading font-bold text-lg text-primary">{workers.length}</p>
        </div>
        <div className="card text-center !p-4">
          <p className="text-xs text-slate-400">Pending Verification</p>
          <p className="font-heading font-bold text-lg text-accent">{pendingCount}</p>
        </div>
        <div className="card text-center !p-4">
          <p className="text-xs text-slate-400">Welfare Fund</p>
          <p className="font-heading font-bold text-lg text-primary">₹{cooperative.welfareFundBalance.toFixed(0)}</p>
        </div>
      </div>

      <h2 className="font-heading font-semibold mb-3">Cooperative Members</h2>
      <div className="space-y-3">
        {workers.map((w) => (
          <div key={w._id} className="card flex items-center gap-3">
            <img src={w.userId?.photoUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
            <div className="flex-1">
              <p className="font-medium text-slate-800">{w.userId?.name}</p>
              <p className="text-xs text-slate-500 mb-1">{w.category?.join(", ")}</p>
              <div className="flex gap-2 flex-wrap">
                <VerifiedBadge verified={w.verified} />
                <IdVerifiedBadge verified={w.idVerified} />
                <TrustScoreBadge score={w.trustScore} />
              </div>
              {w.aadharLast4 && !w.idVerified && (
                <p className="text-xs text-slate-400 mt-1">Submitted Aadhaar ending in {w.aadharLast4} — confirm against their card</p>
              )}
            </div>
            <div className="flex flex-col gap-2 items-stretch">
              {!w.verified && (
                <button onClick={() => verifyWorker(w._id)} className="btn-primary !px-3 !py-2 text-sm whitespace-nowrap">
                  Verify
                </button>
              )}
              {w.aadharLast4 && !w.idVerified && (
                <button onClick={() => confirmId(w._id)} className="btn-secondary !px-3 !py-2 text-sm whitespace-nowrap">
                  Confirm ID
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
