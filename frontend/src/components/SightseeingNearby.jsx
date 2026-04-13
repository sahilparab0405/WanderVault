import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Clock, Star, ExternalLink, Compass, Ticket, MountainSnow, Landmark, TreePine, Waves, RefreshCw, AlertCircle } from 'lucide-react';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ─── Distance & Time Logic ─── */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTime(distKm) {
  if (distKm < 1) return `${Math.max(1, Math.round(distKm * 12))} min walk`;
  if (distKm <= 3) return `${Math.max(1, Math.round(distKm * 12))} min walk`;
  return `${Math.max(5, Math.round(distKm * 3))} min by auto`;
}

function getRating(seed) {
  return (3.8 + ((seed % 12) / 10)).toFixed(1);
}

/* ─── Categories & Icons ─── */
const CATEGORY_MAP = {
  museums:   { label: 'Museums',   color: '#1a2b4a', Icon: Landmark },
  parks:     { label: 'Parks',     color: '#22C55E', Icon: TreePine },
  temples:   { label: 'Temples',   color: '#FF6B35', Icon: MountainSnow },
  monuments: { label: 'Monuments', color: '#6B7280', Icon: Compass },
  beaches:   { label: 'Beaches',   color: '#2563EB', Icon: Waves },
};

function getMapIcon(color) {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center); }, [center, map]);
  return null;
}

/* ─── Cache helpers ─── */
const CACHE_HOUR = 60 * 60 * 1000;

function writeFallbackCache(cacheKey) {
  localStorage.setItem(cacheKey, JSON.stringify({
    ts: Date.now() - (23 * CACHE_HOUR),
    data: []
  }));
}

export default function SightseeingNearby({ latitude, longitude }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false); // false | 'rate_limited' | 'network'
  const [retryIn, setRetryIn] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const BACKEND_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5000';

  const processPlaces = useCallback((elements) => {
    return elements.map(el => {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      if (!lat || !lon) return null;
      const dist = getDistance(latitude, longitude, lat, lon);
      const name = el.tags?.name || 'Local Attraction';
      const seed = Math.abs(String(el.id).split('').reduce((a,c) => a + c.charCodeAt(0), 0));

      let cat = 'monuments';
      if (el.tags?.tourism === 'museum') cat = 'museums';
      else if (el.tags?.leisure === 'park' || el.tags?.leisure === 'nature_reserve') cat = 'parks';
      else if (el.tags?.amenity === 'place_of_worship') cat = 'temples';
      else if (el.tags?.natural === 'beach') cat = 'beaches';

      const entryFee = el.tags?.fee === 'yes' ? 'Entry fee applies'
        : el.tags?.fee === 'no' ? 'Free entry'
        : seed % 3 === 0 ? 'Entry fee varies' : 'Free entry';

      return {
        id: el.id,
        name,
        category: cat,
        distanceKm: dist,
        timeEst: formatTime(dist),
        rating: el.tags?.rating ? parseFloat(el.tags.rating).toFixed(1) : getRating(seed),
        desc: el.tags?.description || `Famous ${CATEGORY_MAP[cat].label.toLowerCase()} in the area.`,
        fee: entryFee,
        lat, lon
      };
    })
    .filter(p => p && p.name && p.name.length > 2 && p.name !== 'Local Attraction')
    .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [latitude, longitude]);

  const fetchSightseeing = useCallback(async () => {
    if (!latitude || !longitude) return;
    setLoading(true);
    setError(false);
    setRetryIn(null);

    const cacheKey = `wv_sightseeing_${latitude}_${longitude}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < 24 * CACHE_HOUR) {
          setPlaces(processPlaces(parsed.data));
          setLoading(false);
          return;
        }
      } catch { /* stale/invalid — proceed to fetch */ }
    }

    try {
      const res = await fetch(`${BACKEND_BASE}/api/places/sightseeing?lat=${latitude}&lon=${longitude}`);

      if (res.status === 429) {
        writeFallbackCache(cacheKey);
        setError('rate_limited');
        setLoading(false);
        let secs = 30;
        setRetryIn(secs);
        const timer = setInterval(() => {
          secs -= 1;
          setRetryIn(secs);
          if (secs <= 0) clearInterval(timer);
        }, 1000);
        return;
      }

      if (!res.ok) {
        setError('network');
        setLoading(false);
        return;
      }

      const data = await res.json();
      const elements = data.elements || [];
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: elements }));
      setPlaces(processPlaces(elements));
      setLoading(false);
    } catch {
      setError('network');
      setLoading(false);
    }
  }, [latitude, longitude, BACKEND_BASE, processPlaces]);

  useEffect(() => {
    fetchSightseeing();
  }, [fetchSightseeing]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex gap-2 mb-6"><div className="h-8 w-20 bg-border rounded-full" /><div className="h-8 w-24 bg-border rounded-full" /><div className="h-8 w-20 bg-border rounded-full" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(k => <div key={k} className="h-44 bg-border/50 rounded-xl" />)}
        </div>
        <div className="h-[300px] w-full bg-border/50 rounded-xl mt-6" />
      </div>
    );
  }

  /* ── Error State ── */
  if (error) {
    const isRateLimited = error === 'rate_limited';
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-xl text-center">
        <AlertCircle size={28} className="mx-auto mb-3 text-amber-500" strokeWidth={1.5} />
        <p className="font-bold text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {isRateLimited ? 'Places temporarily unavailable.' : 'Could not load sightseeing places.'}
        </p>
        <p className="text-xs mt-1 text-amber-700" style={{ fontFamily: "'Inter', sans-serif" }}>
          {isRateLimited
            ? 'Check back in a few minutes. The map service is busy.'
            : 'A network error occurred. Please check your connection.'}
        </p>
        <button
          onClick={fetchSightseeing}
          disabled={retryIn !== null && retryIn > 0}
          className="mt-4 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold border-0 cursor-pointer transition-colors"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <RefreshCw size={14} />
          {retryIn !== null && retryIn > 0 ? `Try Again (${retryIn}s)` : 'Try Again'}
        </button>
      </div>
    );
  }

  const filtered = activeFilter === 'All' ? places : places.filter(p => p.category === activeFilter);
  const categories = ['All', 'museums', 'parks', 'temples', 'monuments', 'beaches'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-navy flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
          <Compass size={20} className="text-accent" /> Sightseeing
        </h2>
      </div>

      {places.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-border">
          <Compass size={32} strokeWidth={1.5} className="text-text-muted mx-auto mb-3 opacity-50" />
          <p className="text-sm text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>No attractions found nearby.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map(c => (
              <button
                key={c} onClick={() => setActiveFilter(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer ${activeFilter === c ? 'bg-accent border-accent text-white' : 'bg-white border-navy text-navy hover:bg-navy/5'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {c === 'All' ? 'All Places' : CATEGORY_MAP[c].label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
            {filtered.map(place => {
              const CatParams = CATEGORY_MAP[place.category];
              const CatIcon = CatParams.Icon;
              return (
                <div key={place.id} className="bg-white rounded-xl border border-border p-4 hover:border-accent/40 transition-colors flex flex-col justify-between" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-navy text-[15px] line-clamp-1 flex-1 leading-tight flex items-center gap-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        <CatIcon size={16} color={CatParams.color}/> {place.name}
                      </h4>
                      <div className="flex items-center gap-0.5 bg-success text-white px-1.5 rounded text-[10px] font-bold shrink-0"><Star size={8} fill="#fff" strokeWidth={0}/> {place.rating}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <span className="flex items-center gap-1 font-medium bg-bg border border-border-light px-2 py-0.5 rounded-md">
                        <MapPin size={12} className="text-accent"/> {(place.distanceKm).toFixed(1)} km
                      </span>
                      <span className="flex items-center gap-1 font-medium bg-bg border border-border-light px-2 py-0.5 rounded-md">
                        <Clock size={12} className="text-primary"/> {place.timeEst}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted mt-3 line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                      "{place.desc}"
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-light flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-text-muted uppercase flex items-center gap-1"><Ticket size={12}/> {place.fee}</span>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-navy text-navy text-[11px] font-bold hover:bg-navy hover:text-white transition-colors duration-150 no-underline">
                      View on Maps <ExternalLink size={10} strokeWidth={2}/>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length > 0 && (
            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border shadow-sm mt-4" style={{ zIndex: 0 }}>
              <MapContainer center={[latitude, longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={[latitude, longitude]} />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />
                <Marker position={[latitude, longitude]} icon={L.divIcon({ html: `<div style="background-color: #2563EB; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(37,99,235,0.8);"></div>`, className: '', iconSize: [16,16] })}>
                  <Popup>Your Destination</Popup>
                </Marker>
                {filtered.map(p => (
                  <Marker key={p.id} position={[p.lat, p.lon]} icon={getMapIcon(CATEGORY_MAP[p.category].color)}>
                    <Popup><strong style={{ fontFamily: "'Poppins', sans-serif" }}>{p.name}</strong><br/>{CATEGORY_MAP[p.category].label}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
