import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LocateFixed, MapPin } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function BookingForm() {
  const { workerId } = useParams();
  const [worker, setWorker] = useState(null);
  const [form, setForm] = useState({ scheduledAt: "", address: "", notes: "", amount: "" });
  const [destination, setDestination] = useState(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/workers/${workerId}`).then((res) => {
      setWorker(res.data);
      setForm((f) => ({ ...f, amount: res.data.priceRange?.min || 200, address: user?.address || "" }));
    });
  }, [workerId]);

  const pinCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location isn't available on this device/browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDestination({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location pinned — the worker will see exactly where to go");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location — check location permissions");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/bookings", {
        workerId,
        category: worker.category[0],
        scheduledAt: form.scheduledAt,
        address: form.address,
        notes: form.notes,
        amount: Number(form.amount),
        destination,
      });
      toast.success("Booking requested!");
      navigate(`/booking/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (!worker) return <div className="max-w-lg mx-auto px-4 py-10 text-slate-400">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading text-xl font-semibold mb-1">Book {worker.userId?.name}</h1>
      <p className="text-slate-500 text-sm mb-5">{worker.category?.join(", ")}</p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Date &amp; Time</label>
          <input
            type="datetime-local" required className="input"
            value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Service Address</label>
          <textarea
            required className="input" rows={2}
            value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <button
            type="button" onClick={pinCurrentLocation} disabled={locating}
            className="flex items-center gap-1.5 text-xs font-medium text-primary mt-2"
          >
            <LocateFixed size={14} /> {locating ? "Pinning location..." : "Pin exact location on map"}
          </button>
          {destination && (
            <p className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <MapPin size={12} /> Location pinned — the worker can navigate straight to you and won't get lost.
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Notes (optional)</label>
          <textarea
            className="input" rows={2} placeholder="Describe the issue or task..."
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">
            Agreed Amount (₹{worker.priceRange?.min}–₹{worker.priceRange?.max} typical range)
          </label>
          <input
            type="number" required min={1} className="input"
            value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <p className="text-xs text-slate-400 mt-1">
            This full amount is shown transparently in the ledger — you'll see exactly how it's split between the worker and the cooperative's fee.
          </p>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Booking..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}
