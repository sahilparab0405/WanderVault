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
import { Map } from 'lucide-react';

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
  restaurant: '#FF6B35', 
  attraction: '#1a2b4a',
  hotel: '#2563EB',
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

  useEffect(() => {
    // FIX 2: Handle map resizing when switching tabs from hidden to block
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    const container = map.getContainer();
    if (container) observer.observe(container);
    
    // Also invalidate immediately after a short delay to be safe
    const timer = setTimeout(() => map.invalidateSize(), 150);
    
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [map]);

  return null;
}

export default function TripMap({ latitude, longitude, destination, nearbyPlaces = [] }) {
  if (!latitude || !longitude) {
    return (
      <div
        className="bg-card rounded- border border-border p-8 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded- bg-primary/10 flex items-center justify-center text-primary">
            <Map size={24} strokeWidth={1.5} />
          </div>
        </div>
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
      className="bg-card rounded-3xl overflow-hidden border border-border h-full flex flex-col shadow-2xl"
    >
      {/* Map header */}
      <div className="px-6 py-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map size={16} strokeWidth={1.5} className="text-primary" />
          <h3 className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Destination Map
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded- bg-primary" />
            <span className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>Destination</span>
          </div>
          <div className="flex items-center gap-1">
             <div className="w-2.5 h-2.5 rounded-" style={{ background: '#FF6B35' }}/>
             <span className="text-[10px] text-text-muted">Dining</span>
          </div>
          <div className="flex items-center gap-1">
             <div className="w-2.5 h-2.5 rounded-" style={{ background: '#1a2b4a' }}/>
             <span className="text-[10px] text-text-muted">Sightseeing</span>
          </div>
          <div className="flex items-center gap-1">
             <div className="w-2.5 h-2.5 rounded-" style={{ background: '#2563EB' }}/>
             <span className="text-[10px] text-text-muted">Hotels</span>
          </div>
        </div>
      </div>

      {/* Map container — flex-1 fills all remaining height */}
      <div className="flex-1 min-h-0" style={{ width: '100%' }}>
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
                  {destination}
                </strong>
                <span style={{ fontSize: 11, color: '#6B7280' }}>Your destination</span>
              </div>
            </Popup>
          </Marker>

          {/* Nearby place markers */}
          {nearbyPlaces.map((place, idx) => {
            const lat = place.geocodes?.main?.latitude || place.lat;
            const lon = place.geocodes?.main?.longitude || place.lon;
            if (!lat || !lon) return null;
            
            const categoryName = place.categories?.[0]?.name || place.categoryLabel || place.pin_type;
            const distance = place.distance ? (place.distance / 1000).toFixed(1) + 'km' : '';
            const price = place.price ? '₹'.repeat(place.price) : '';
            
            return (
            <Marker
              key={place.fsq_id || place.id || idx}
              position={[lat, lon]}
              icon={createColoredIcon(CATEGORY_COLORS[place.pin_type] || CATEGORY_COLORS.default)}
            >
              <Popup>
                <div style={{ fontFamily: "'Inter', sans-serif", minWidth: 160 }}>
                  <strong style={{ fontFamily: "'Poppins', sans-serif", display: 'block', marginBottom: 4, color: '#1a2b4a', fontSize: '14px' }}>
                    {place.name}
                  </strong>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: 6, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{fontWeight: 600}}>{categoryName}</span>
                    <span>{distance} {price ? `· ${price}` : ''}</span>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + (place.location?.formatted_address || ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'block', 
                      background: '#1a2b4a', 
                      color: 'white', 
                      textAlign: 'center', 
                      padding: '6px 0', 
                      borderRadius: '6px', 
                      textDecoration: 'none',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  >
                    View on Maps
                  </a>
                </div>
              </Popup>
            </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
