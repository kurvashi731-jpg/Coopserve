import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

// Fix Leaflet's default marker icons not loading correctly under Vite bundling
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const workerIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "filter hue-rotate-[130deg] saturate-150", // tints the worker pin teal-ish to distinguish from destination
});

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center?.[0], center?.[1]]);
  return null;
}

/**
 * markers: [{ position: [lat, lng], label: "Worker", variant: "worker" | "destination" }]
 */
export default function LiveMap({ markers = [], height = 260 }) {
  const validMarkers = markers.filter((m) => m.position && m.position[0] != null && m.position[1] != null);
  if (validMarkers.length === 0) {
    return (
      <div
        className="rounded-xl bg-slate-100 flex items-center justify-center text-sm text-slate-400"
        style={{ height }}
      >
        Waiting for location...
      </div>
    );
  }

  const center = validMarkers[0].position;

  return (
    <div className="rounded-xl overflow-hidden" style={{ height }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validMarkers.map((m, i) => (
          <Marker key={i} position={m.position} icon={m.variant === "worker" ? workerIcon : new L.Icon.Default()}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        <Recenter center={validMarkers[0].position} />
      </MapContainer>
    </div>
  );
}
