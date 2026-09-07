import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Phone, MapPin, Star, Navigation } from "lucide-react";
import api from "../api/axios";
import StatusStepper from "../components/StatusStepper";
import { VerifiedBadge, IdVerifiedBadge, TrustScoreBadge } from "../components/Badge";
import LiveMap from "../components/LiveMap";
import { useAuth } from "../context/AuthContext";

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const { user } = useAuth();

  const load = () => api.get(`/bookings/${id}`).then((res) => setBooking(res.data));

  useEffect(() => { load(); }, [id]);

  // Poll every 8s for live worker location while the job is active, so the map stays current
  useEffect(() => {
    if (!booking || !["accepted", "in_progress"].includes(booking.status)) return;
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [booking?.status, id]);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post("/reviews", { bookingId: id, rating, comment });
      toast.success("Thanks for your review!");
      setReviewSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit review");
    }
  };

  if (!booking) return <div className="max-w-lg mx-auto px-4 py-10 text-slate-400">Loading...</div>;

  const otherParty = user?.role === "customer" ? booking.workerId?.userId : booking.customerId;
  const showLiveMap =
    user?.role === "customer" &&
    ["accepted", "in_progress"].includes(booking.status) &&
    booking.workerLiveLocation?.lat;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading text-xl font-semibold mb-5">Booking Details</h1>

      <div className="card mb-4">
        <StatusStepper status={booking.status} />
      </div>

      <div className="card mb-4 flex items-center gap-4">
        <img
          src={otherParty?.photoUrl || `https://i.pravatar.cc/150?u=${otherParty?._id || "x"}`}
          className="w-14 h-14 rounded-full object-cover"
          alt=""
        />
        <div className="flex-1">
          <p className="font-medium text-slate-800">{otherParty?.name}</p>
          <p className="text-xs text-slate-500 mb-1">{booking.category}</p>
          {user?.role === "customer" && booking.workerId && (
            <div className="flex gap-1.5 flex-wrap">
              <VerifiedBadge verified={booking.workerId.verified} />
              <IdVerifiedBadge verified={booking.workerId.idVerified} />
              <TrustScoreBadge score={booking.workerId.trustScore} />
            </div>
          )}
        </div>
        {["accepted", "in_progress", "completed"].includes(booking.status) && otherParty?.phone && (
          <a href={`tel:${otherParty.phone}`} className="btn-secondary !px-3 !py-2 flex items-center gap-1 text-sm">
            <Phone size={15} /> Call
          </a>
        )}
      </div>

      <div className="card mb-4 space-y-2 text-sm">
        <p className="flex items-start gap-2 text-slate-600"><MapPin size={16} className="mt-0.5 flex-shrink-0" /> {booking.address}</p>
        <p className="text-slate-600">📅 {new Date(booking.scheduledAt).toLocaleString()}</p>
        {booking.notes && <p className="text-slate-600">📝 {booking.notes}</p>}
        <p className="font-semibold text-slate-800 pt-1">Amount: ₹{booking.amount}</p>
      </div>

      {showLiveMap && (
        <div className="card mb-4">
          <h2 className="font-heading font-semibold mb-2 flex items-center gap-2 text-sm">
            <Navigation size={16} className="text-primary" /> {otherParty?.name}'s live location
          </h2>
          <LiveMap
            markers={[
              { position: [booking.workerLiveLocation.lat, booking.workerLiveLocation.lng], label: otherParty?.name, variant: "worker" },
              ...(booking.destination?.lat ? [{ position: [booking.destination.lat, booking.destination.lng], label: "You", variant: "destination" }] : []),
            ]}
          />
          <p className="text-xs text-slate-400 mt-2">
            Updated {Math.round((Date.now() - new Date(booking.workerLiveLocation.updatedAt)) / 1000)}s ago
          </p>
        </div>
      )}

      {user?.role === "customer" && ["accepted", "in_progress"].includes(booking.status) && !booking.workerLiveLocation?.lat && (
        <div className="bg-amber-50 text-amber-700 text-xs px-4 py-3 rounded-xl mb-4">
          {otherParty?.name} hasn't started sharing their live location yet.
        </div>
      )}

      {user?.role === "customer" && booking.status === "completed" && !reviewSubmitted && (
        <form onSubmit={submitReview} className="card space-y-3">
          <h2 className="font-heading font-semibold">Rate this service</h2>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)}>
                <Star size={24} className={n <= rating ? "fill-accent text-accent" : "text-slate-300"} />
              </button>
            ))}
          </div>
          <textarea className="input" rows={2} placeholder="Share your experience..." value={comment} onChange={(e) => setComment(e.target.value)} />
          <button type="submit" className="btn-primary w-full">Submit Review</button>
        </form>
      )}
    </div>
  );
}
