/**
 * TripMap — Interactive Leaflet Map Component
 *
 * Shows destination marker + nearby place markers on an OpenStreetMap tile layer.
 * Uses react-leaflet for React integration and Leaflet for the map engine.
 */

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ─── Fix Leaflet default marker icon issue in bundlers ─── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ─── Custom colored marker icons ─── */
function createColoredIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; height: 24px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

/* Destination marker — larger, primary brand blue */
function createDestinationIcon() {
  return L.divIcon({
    className: 'destination-marker',
    html: `<div style="
      width: 36px; height: 36px;
      background: #2563EB;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 3px 10px rgba(37,99,235,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

/* ─── Category → color mapping ─── */
const CATEGORY_COLORS = {
  restaurant: '#EF4444',
  hotel: '#8B5CF6',
  attraction: '#F59E0B',
  default: '#6B7280',
};

/* ─── MapUpdater: re-centers when coords change ─── */
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function TripMap({ latitude, longitude, destination, nearbyPlaces = [] }) {
  if (!latitude || !longitude) {
    return (
      <div
        className="bg-card rounded-xl border border-border p-8 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <span className="text-4xl mb-3 block">🗺️</span>
        <p className="text-navy font-semibold text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Map not available
        </p>
        <p className="text-text-muted text-xs mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
          No coordinates found for this trip. Try creating a new trip with location search.
        </p>
      </div>
    );
  }

  const center = [latitude, longitude];

  return (
    <div
      className="bg-card rounded-xl overflow-hidden border border-border"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Map header */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺️</span>
          <h3 className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Destination Map
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>Destination</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS.restaurant }} />
            <span className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>Food</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS.hotel }} />
            <span className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>Hotel</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS.attraction }} />
            <span className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>Attraction</span>
          </div>
        </div>
      </div>

      {/* Map container */}
      <div style={{ height: '350px', width: '100%' }}>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={center} zoom={13} />

          {/* Destination marker */}
          <Marker position={center} icon={createDestinationIcon()}>
            <Popup>
              <div style={{ fontFamily: "'Inter', sans-serif", minWidth: 120 }}>
                <strong style={{ fontFamily: "'Poppins', sans-serif", display: 'block', marginBottom: 2 }}>
                  📍 {destination}
                </strong>
                <span style={{ fontSize: 11, color: '#6B7280' }}>Your destination</span>
              </div>
            </Popup>
          </Marker>

          {/* Nearby place markers */}
          {nearbyPlaces.map((place, idx) => (
            <Marker
              key={place.id || idx}
              position={[place.lat, place.lon]}
              icon={createColoredIcon(CATEGORY_COLORS[place.category] || CATEGORY_COLORS.default)}
            >
              <Popup>
                <div style={{ fontFamily: "'Inter', sans-serif", minWidth: 140 }}>
                  <strong style={{ fontFamily: "'Poppins', sans-serif", display: 'block', marginBottom: 2 }}>
                    {place.icon} {place.name}
                  </strong>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>
                    {place.categoryLabel}
                    {place.distance && ` • ${place.distance}`}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
