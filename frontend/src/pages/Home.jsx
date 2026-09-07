import { useEffect, useState } from "react";
import { Search, MapPin, LocateFixed, Shuffle } from "lucide-react";
import api from "../api/axios";
import WorkerCard from "../components/WorkerCard";

const SORT_MODES = [
  { key: "fair", label: "Fair Rotation" },
  { key: "distance", label: "Nearest" },
  { key: "rating", label: "Top Rated" },
];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [meta, setMeta] = useState({ radiusKm: null, expanded: false, sortMode: "fair" });
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("fair");
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | granted | denied

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data));
    requestLocation();
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { sortMode };
    if (activeCategory) params.category = activeCategory;
    if (search) params.search = search;
    if (coords) {
      params.lat = coords.lat;
      params.lng = coords.lng;
    }
    api.get("/workers", { params }).then((res) => {
      setWorkers(res.data.workers || []);
      setMeta(res.data.meta || {});
      setLoading(false);
    });
  }, [activeCategory, search, coords, sortMode]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <h1 className="font-heading text-2xl font-semibold mb-1">Find trusted local help</h1>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <p className="text-slate-500">Verified workers from community cooperatives near you.</p>
        {locationStatus !== "granted" && (
          <button onClick={requestLocation} className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <LocateFixed size={14} />
            {locationStatus === "loading" ? "Locating..." : "Show workers nearest to me"}
          </button>
        )}
      </div>

      {locationStatus === "denied" && (
        <div className="bg-amber-50 text-amber-700 text-xs px-4 py-2.5 rounded-xl mb-4">
          Location access was blocked, so nearby matching won't work. Click the 🔒 icon in your browser's address bar →
          Site settings → Location → Allow, then refresh this page.
        </div>
      )}

      {locationStatus === "granted" && (
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex gap-2">
            {SORT_MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setSortMode(m.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  sortMode === m.key ? "bg-primary text-white" : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {sortMode === "fair" && meta.radiusKm && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin size={13} /> Within {meta.radiusKm} km{meta.expanded ? " (expanded — few workers nearby)" : ""}
            </span>
          )}
        </div>
      )}

      {locationStatus === "granted" && sortMode === "fair" && (
        <div className="bg-primary/5 text-primary text-xs px-4 py-2.5 rounded-xl mb-4 flex items-start gap-2">
          <Shuffle size={14} className="mt-0.5 flex-shrink-0" />
          <span>
            <strong>Fair Rotation is on.</strong> Workers within {meta.radiusKm || 5} km are shown in order of who's gone
            longest without a job — not just the highest-rated — so every cooperative member gets an equal shot at work.
          </span>
        </div>
      )}

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          className="input pl-10"
          placeholder="Search by skill, category, or worker name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button
          onClick={() => setActiveCategory("")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            activeCategory === "" ? "bg-primary text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => setActiveCategory(c.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeCategory === c.name ? "bg-primary text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <div className="text-center text-slate-400 py-16">No workers found. Try a different search or category.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {locationStatus === "granted" && workers.every((w) => w.distanceKm == null) && (
            <div className="md:col-span-2 bg-slate-50 text-slate-500 text-xs px-4 py-2.5 rounded-xl">
              No distance data yet for these workers — if you just updated the app, run <code className="bg-white px-1 rounded">npm run seed</code> again in the backend folder to add worker locations.
            </div>
          )}
          {workers.map((w) => (
            <WorkerCard key={w._id} worker={w} />
          ))}
        </div>
      )}
    </div>
  );
}
