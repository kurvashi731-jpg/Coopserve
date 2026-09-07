import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Phone, MapPin, Navigation } from "lucide-react";
import api from "../api/axios";
import StatusStepper from "../components/StatusStepper";
import LiveMap from "../components/LiveMap";

const NEXT_ACTION = {
  requested: { label: "Accept Job", next: "accepted" },
  accepted: { label: "Start Job", next: "in_progress" },
  in_progress: { label: "Mark Completed", next: "completed" },
};

export default function JobDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const watchIdRef = useRef(null);
  const navigate = useNavigate();

  const load = () => api.get(`/bookings/${id}`).then((res) => setBooking(res.data));
  useEffect(() => { load(); }, [id]);

  // Stop sharing location automatically if the job leaves an active state (e.g. gets completed)
  useEffect(() => {
    if (booking && !["accepted", "in_progress"].includes(booking.status)) {
      stopSharing();
    }
  }, [booking?.status]);

  useEffect(() => () => stopSharing(), []); // cleanup on unmount

  const startSharing = () => {
    if (!navigator.geolocation) {
      toast.error("Location isn't available on this device/browser");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        api.patch(`/bookings/${id}/location`, { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => {});
      },
      () => toast.error("Couldn't access your location — check permissions"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setSharingLocation(true);
    toast.success("Sharing your live location with the customer");
  };

  const stopSharing = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharingLocation(false);
  };

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success(`Job marked as ${status.replace("_", " ")}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (!booking) return <div className="max-w-lg mx-auto px-4 py-10 text-slate-400">Loading...</div>;

  const action = NEXT_ACTION[booking.status];
  const canShareLocation = ["accepted", "in_progress"].includes(booking.status);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading text-xl font-semibold mb-5">Job Details</h1>

      <div className="card mb-4">
        <StatusStepper status={booking.status} />
      </div>

      <div className="card mb-4 flex items-center gap-4">
        <img src={booking.customerId?.photoUrl || `https://i.pravatar.cc/150?u=${booking.customerId?._id}`} className="w-14 h-14 rounded-full object-cover" alt="" />
        <div className="flex-1">
          <p className="font-medium text-slate-800">{booking.customerId?.name}</p>
          <p className="text-xs text-slate-500">{booking.category}</p>
        </div>
        {booking.customerId?.phone && (
          <a href={`tel:${booking.customerId.phone}`} className="btn-secondary !px-3 !py-2 flex items-center gap-1 text-sm">
            <Phone size={15} /> Call
          </a>
        )}
      </div>

      <div className="card mb-4 space-y-2 text-sm">
        <p className="flex items-start gap-2 text-slate-600"><MapPin size={16} className="mt-0.5 flex-shrink-0" /> {booking.address}</p>
        <p className="text-slate-600">📅 {new Date(booking.scheduledAt).toLocaleString()}</p>
        {booking.notes && <p className="text-slate-600">📝 {booking.notes}</p>}
        <p className="font-semibold text-slate-800 pt-1">Agreed Amount: ₹{booking.amount}</p>
      </div>

      {booking.destination?.lat && (
        <div className="card mb-4">
          <h2 className="font-heading font-semibold mb-2 flex items-center gap-2 text-sm">
            <Navigation size={16} className="text-primary" /> Customer's pinned location
          </h2>
          <LiveMap markers={[{ position: [booking.destination.lat, booking.destination.lng], label: "Customer's location", variant: "destination" }]} />
        </div>
      )}

      {canShareLocation && (
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-semibold text-sm mb-0.5">Share live location</h2>
              <p className="text-xs text-slate-500">Let the customer track you on the map so neither of you gets lost.</p>
            </div>
            <button
              onClick={sharingLocation ? stopSharing : startSharing}
              className={sharingLocation ? "btn-secondary !px-3 !py-2 text-sm whitespace-nowrap" : "btn-primary !px-3 !py-2 text-sm whitespace-nowrap"}
            >
              {sharingLocation ? "Stop Sharing" : "Start Sharing"}
            </button>
          </div>
        </div>
      )}

      {action && (
        <button disabled={updating} onClick={() => updateStatus(action.next)} className="btn-primary w-full">
          {updating ? "Updating..." : action.label}
        </button>
      )}
      {booking.status === "requested" && (
        <button disabled={updating} onClick={() => updateStatus("cancelled")} className="btn-secondary w-full mt-2">
          Decline Job
        </button>
      )}
      {booking.status === "completed" && (
        <button onClick={() => navigate("/worker/earnings")} className="btn-secondary w-full">
          View Earnings Breakdown
        </button>
      )}
    </div>
  );
}
