import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Clock, Star, Tag, ExternalLink, Utensils, Coffee, RefreshCw, AlertCircle } from 'lucide-react';

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
  return (3.5 + ((seed % 15) / 10)).toFixed(1);
}

/* ─── Map Icon ─── */
const mapIcon = L.divIcon({
  html: `<div style="background-color: #FF6B35; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center); }, [center, map]);
  return null;
}

/* ─── Cache helpers ─── */
const CACHE_HOUR = 60 * 60 * 1000;

function writeFallbackCache(cacheKey) {
  // Write empty result with ts set 23h ago → expires in ~1h
  localStorage.setItem(cacheKey, JSON.stringify({
    ts: Date.now() - (23 * CACHE_HOUR),
    data: []
  }));
}

const DINING_FALLBACK = [
  { id: 'f1', name: "Local Restaurant", cuisine: "Multi-cuisine", rating: 4.2, desc: "A cozy local spot with a variety of dishes.", lat_off: 0.002, lon_off: 0.001 },
  { id: 'f2', name: "Sunrise Cafe", cuisine: "Breakfast & Coffee", rating: 4.5, desc: "Perfect place for your morning brew and snacks.", lat_off: -0.001, lon_off: 0.003 },
  { id: 'f3', name: "The Curry House", cuisine: "Indian", rating: 4.0, desc: "Authentic local flavors and spicy curries.", lat_off: 0.003, lon_off: -0.002 },
  { id: 'f4', name: "Riverside Bistro", cuisine: "Continental", rating: 4.3, desc: "Scenic dining with a great selection of appetizers.", lat_off: -0.002, lon_off: -0.002 },
  { id: 'f5', name: "Street Flavors", cuisine: "Street Food", rating: 4.1, desc: "Quick bites and local street delicacies.", lat_off: 0.001, lon_off: 0.004 },
];

export default function DiningNearby({ latitude, longitude }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false); // false | 'rate_limited' | 'network'
  const [retryIn, setRetryIn] = useState(null); // countdown seconds
  const [activeFilter, setActiveFilter] = useState('All');
  const [cuisines, setCuisines] = useState(['All']);
  const [usingFallback, setUsingFallback] = useState(false);

  const BACKEND_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5000';

  const processPlaces = useCallback((elements, isFallback = false) => {
    let pList = [];
    if (isFallback) {
      pList = elements.map(f => ({
        id: f.id,
        name: f.name,
        cuisine: f.cuisine,
        distanceKm: 0.5 + Math.random() * 2,
        timeEst: formatTime(0.5 + Math.random() * 2),
        rating: f.rating,
        desc: f.desc,
        lat: latitude + f.lat_off,
        lon: longitude + f.lon_off,
        photo: null
      }));
    } else {
      pList = elements.map(el => {
        const lat = el.geocodes?.main?.latitude;
        const lon = el.geocodes?.main?.longitude;
        if (!lat || !lon) return null;
        
        const dist = (el.distance / 1000) || getDistance(latitude, longitude, lat, lon);
        const name = el.name || 'Local Eatery';
        const cuisine = el.categories?.[0]?.name || 'Dining';
        const seed = Math.abs(String(el.fsq_id || el.id).split('').reduce((a,c) => a + c.charCodeAt(0), 0));
        
        let rating = el.rating ? (el.rating / 2).toFixed(1) : getRating(seed);
        const desc = el.location?.formatted_address || `Popular ${cuisine.toLowerCase()} spot in the area.`;
        const photo = el.photos && el.photos.length > 0 ? `${el.photos[0].prefix}400x300${el.photos[0].suffix}` : null;
        const priceTier = el.price ? '$'.repeat(el.price) : '$$';

        return {
          id: el.fsq_id || el.id,
          name,
          cuisine,
          distanceKm: dist,
          timeEst: formatTime(dist),
          rating,
          desc,
          lat, lon,
          photo,
          priceTier
        };
      })
      .filter(p => p && p.name);
    }

    pList = pList.sort((a, b) => a.distanceKm - b.distanceKm);

    const unique = ['All', ...new Set(pList.map(p => p.cuisine))].slice(0, 6);
    setCuisines(unique);
    setPlaces(pList);
    setLoading(false);
    setUsingFallback(isFallback);
  }, [latitude, longitude]);

  const fetchDining = useCallback(async () => {
    if (!latitude || !longitude) return;
    setLoading(true);
    setError(false);
    setRetryIn(null);
    setUsingFallback(false);

    const cacheKey = `wv_fsq_dining_${latitude}_${longitude}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < 24 * CACHE_HOUR && parsed.data && parsed.data.length > 0) {
          processPlaces(parsed.data);
          return;
        }
      } catch { /* stale/invalid cache — proceed to fetch */ }
    }

    try {
      const fsqKey = import.meta.env.VITE_FOURSQUARE_KEY;
      if (!fsqKey) {
        console.warn('Foursquare key missing, using fallback data automatically.');
        setError('network');
        processPlaces(DINING_FALLBACK, true);
        return;
      }

      const res = await fetch(`https://api.foursquare.com/v3/places/search?ll=${latitude},${longitude}&categories=13065&limit=10&radius=5000&fields=fsq_id,name,categories,distance,rating,geocodes,location,photos,price`, {
        headers: {
          'Authorization': fsqKey,
          'Accept': 'application/json'
        }
      });

      if (res.status === 429) {
        writeFallbackCache(cacheKey);
        setError('rate_limited');
        processPlaces(DINING_FALLBACK, true);
        
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
        processPlaces(DINING_FALLBACK, true);
        return;
      }

      const data = await res.json();
      const elements = data.results || [];
      if (elements.length === 0) {
        processPlaces(DINING_FALLBACK, true);
      } else {
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: elements }));
        processPlaces(elements);
      }
    } catch (e) {
      console.warn("Foursquare fetch failed, using fallback:", e);
      setError('network');
      processPlaces(DINING_FALLBACK, true);
    }
  }, [latitude, longitude, processPlaces]);

  useEffect(() => {
    fetchDining();
  }, [fetchDining]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex gap-2 mb-6"><div className="h-8 w-20 bg-border rounded-full" /><div className="h-8 w-24 bg-border rounded-full" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(k => <div key={k} className="h-40 bg-border/50 rounded-xl" />)}
        </div>
        <div className="h-[300px] w-full bg-border/50 rounded-xl mt-6" />
      </div>
    );
  }

  /* ── Error State (Now with Fallback Data) ── */
  const renderErrorNotice = () => {
    if (!error && !usingFallback) return null;
    const isRateLimited = error === 'rate_limited';
    
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <AlertCircle size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-xs" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {usingFallback ? "Showing general suggestions." : isRateLimited ? 'Places temporarily unavailable.' : 'Could not load live data.'}
            </p>
            <p className="text-[10px] text-amber-700" style={{ fontFamily: "'Inter', sans-serif" }}>
              {usingFallback ? "Live data temporarily unavailable. Showing popular nearby staples." : isRateLimited ? "The service is busy. Check back in a few minutes." : "A network error occurred."}
            </p>
          </div>
        </div>
        <button
          onClick={fetchDining}
          disabled={retryIn !== null && retryIn > 0}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-[11px] font-bold border-0 cursor-pointer transition-colors"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <RefreshCw size={12} />
          {retryIn !== null && retryIn > 0 ? `Try Again (${retryIn}s)` : 'Try Again'}
        </button>
      </div>
    );
  };

  const filtered = activeFilter === 'All' ? places : places.filter(p => p.cuisine === activeFilter);

  return (
    <div className="space-y-6">
      {renderErrorNotice()}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-navy flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
          <Utensils size={20} className="text-accent" /> Nearby Dining
        </h2>
      </div>

      {places.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-border">
          <Coffee size={32} strokeWidth={1.5} className="text-text-muted mx-auto mb-3 opacity-50" />
          <p className="text-sm text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>No dining options found nearby.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-2">
            {cuisines.map(c => (
              <button
                key={c} onClick={() => setActiveFilter(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer ${activeFilter === c ? 'bg-accent border-accent text-white' : 'bg-white border-navy text-navy hover:bg-navy/5'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
            {filtered.map(place => (
              <div key={place.id} className="bg-white rounded-xl border border-border p-4 hover:border-accent/40 transition-colors flex flex-col justify-between" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-navy text-[15px] line-clamp-1 flex-1 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>{place.name}</h4>
                    <div className="flex items-center gap-0.5 bg-success text-white px-1.5 rounded text-[10px] font-bold shrink-0"><Star size={8} fill="#fff" strokeWidth={0}/> {place.rating}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <span className="flex items-center gap-1 font-medium bg-bg px-2 py-0.5 rounded-md"><Tag size={12}/>{place.cuisine}</span>
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin size={12} className="text-accent"/> {(place.distanceKm).toFixed(1)} km
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock size={12} className="text-primary"/> {place.timeEst}
                    </span>
                  </div>

                  {place.photo && (
                    <div className="mt-3 w-full h-24 rounded-lg overflow-hidden border border-border-light">
                      <img src={place.photo} alt={place.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-text-muted mt-3 line-clamp-1 italic" style={{ fontFamily: "'Inter', sans-serif" }}>
                    "{place.desc}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border-light text-right">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-navy text-navy text-[11px] font-bold hover:bg-navy hover:text-white transition-colors duration-150 no-underline">
                    View on Maps <ExternalLink size={10} strokeWidth={2}/>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filtered.length > 0 && (
            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border" style={{ zIndex: 0 }}>
              <MapContainer center={[latitude, longitude]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={[latitude, longitude]} />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />
                <Marker position={[latitude, longitude]} icon={L.divIcon({ html: `<div style="background-color: #2563EB; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(37,99,235,0.8);"></div>`, className: '', iconSize: [16,16] })}>
                  <Popup>Your Destination</Popup>
                </Marker>
                {filtered.map(p => (
                  <Marker key={p.id} position={[p.lat, p.lon]} icon={mapIcon}>
                    <Popup><strong style={{ fontFamily: "'Poppins', sans-serif" }}>{p.name}</strong><br/>{p.cuisine}</Popup>
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
