/**
 * NearbyPlaces — Fetches and displays nearby places using Overpass API
 * All category icons replaced with lucide-react SVGs.
 */

import { useState, useEffect, useCallback } from 'react';
import AccommodationList from './AccommodationList';
import { Utensils, Building2, Compass, MapPin, Star, Tag, RefreshCw, AlertTriangle } from 'lucide-react';

/* ─── Category Configuration ─── */
const CATEGORIES = [
  {
    id: 'restaurant',
    label: 'Restaurants & Cafés',
    shortLabel: 'Food',
    Icon: Utensils,
    query: '["amenity"~"restaurant|cafe|fast_food"]',
    color: '#EF4444',
  },
  {
    id: 'hotel',
    label: 'Hotels & Stays',
    shortLabel: 'Hotels',
    Icon: Building2,
    query: '["tourism"~"hotel|guest_house|hostel|motel"]',
    color: '#8B5CF6',
  },
  {
    id: 'attraction',
    label: 'Attractions',
    shortLabel: 'Attractions',
    Icon: Compass,
    query: '["tourism"~"attraction|museum|viewpoint|artwork|gallery"]',
    color: '#F59E0B',
  },
];

/* ─── Distance calculator ─── */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

/* ─── Overpass API fetcher with Cache ─── */
async function fetchNearbyPlaces(lat, lon, category, radius = 3000) {
  const cacheKey = `wv_places_${Number(lat).toFixed(4)}_${Number(lon).toFixed(4)}_${category.id}`;
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      if (Date.now() - parsed.timestamp < 86400000) return parsed.data;
    } catch (e) { console.warn('Cache parse failed', e); }
  }

  const query = `[out:json][timeout:10];(node${category.query}(around:${radius},${lat},${lon});way${category.query}(around:${radius},${lat},${lon}););out center 15;`;
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(query)}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (!response.ok) throw new Error(`Overpass error: ${response.status}`);
    const data = await response.json();
    const formattedData = data.elements.map((el) => {
      const elLat = el.lat || el.center?.lat;
      const elLon = el.lon || el.center?.lon;
      if (!elLat || !elLon || !el.tags?.name) return null;
      const dist = calculateDistance(lat, lon, elLat, elLon);
      return { id: el.id, name: el.tags.name, lat: elLat, lon: elLon, category: category.id, categoryLabel: category.shortLabel, distance: formatDistance(dist), distanceKm: dist, cuisine: el.tags?.cuisine || null, stars: el.tags?.stars || null, website: el.tags?.website || null, phone: el.tags?.phone || null, openingHours: el.tags?.opening_hours || null, address: el.tags?.['addr:street'] ? `${el.tags['addr:street']}${el.tags['addr:housenumber'] ? ' ' + el.tags['addr:housenumber'] : ''}` : null };
    }).filter(Boolean).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 15);
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: formattedData }));
    return formattedData;
  } catch (err) { console.error(`Failed to fetch ${category.label}:`, err); return []; }
}

/* ─── Place Card ─── */
function PlaceCard({ place }) {
  const cat = CATEGORIES.find(c => c.id === place.category);
  const CatIcon = cat?.Icon || Compass;
  return (
    <div className="bg-bg rounded-xl p-6.5 border border-border-light hover:border-border hover:bg-white transition-all duration-150 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat?.color}18` }}>
        <CatIcon size={18} strokeWidth={1.5} style={{ color: cat?.color || '#6B7280' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{place.name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          <span className="text-[10px] text-text-muted font-medium flex items-center gap-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
            <MapPin size={10} strokeWidth={1.5} />{place.distance}
          </span>
          {place.cuisine && (
            <span className="text-[10px] text-text-muted flex items-center gap-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              <Tag size={10} strokeWidth={1.5} />{place.cuisine.split(';')[0]}
            </span>
          )}
          {place.stars && (
            <span className="text-[10px] text-text-muted flex items-center gap-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              <Star size={10} strokeWidth={1.5} />{place.stars} star
            </span>
          )}
        </div>
      </div>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-xl shrink-0 bg-border-light text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>{place.distance}</span>
    </div>
  );
}

/* ─── Main NearbyPlaces Component ─── */
export default function NearbyPlaces({ latitude, longitude, onPlacesLoaded, tripId, destination }) {
  const [places, setPlaces] = useState({ restaurant: [], hotel: [], attraction: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('restaurant');

  const fetchAll = useCallback(async () => {
    if (!latitude || !longitude) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const results = await Promise.all(CATEGORIES.map(cat => fetchNearbyPlaces(latitude, longitude, cat)));
      const newPlaces = { restaurant: results[0], hotel: results[1], attraction: results[2] };
      setPlaces(newPlaces);
      if (onPlacesLoaded) onPlacesLoaded([...results[0], ...results[1], ...results[2]]);
    } catch (err) { console.error(err); setError('Could not load nearby places. Please try again later.'); }
    setLoading(false);
  }, [latitude, longitude, onPlacesLoaded]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!latitude || !longitude) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex justify-center mb-2"><MapPin size={28} strokeWidth={1.5} className="text-text-muted" /></div>
        <p className="text-navy font-semibold text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Nearby places not available</p>
        <p className="text-text-muted text-xs mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>This trip was created without location coordinates. Create a new trip using location search to see nearby places.</p>
      </div>
    );
  }

  const activePlaces = places[activeTab] || [];
  const totalCount = places.restaurant.length + places.hotel.length + places.attraction.length;

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div className="px-6 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={16} strokeWidth={1.5} className="text-accent" />
            <h3 className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Nearby Places</h3>
            {!loading && <span className="text-[10px] bg-primary-50 text-primary px-2 py-0.5 rounded-xl font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>{totalCount} found</span>}
          </div>
          <button onClick={fetchAll} disabled={loading} className="text-text-muted hover:text-primary text-xs cursor-pointer bg-transparent border-0 transition-colors duration-150 disabled:opacity-50 flex items-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }} aria-label="Refresh nearby places">
            {loading
              ? <span className="w-3 h-3 border border-text-muted border-t-primary rounded-xl animate-spin" />
              : <RefreshCw size={12} strokeWidth={1.5} />
            }
            Refresh
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mt-3">
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;
            const count = places[cat.id]?.length || 0;
            const TabIcon = cat.Icon;
            return (
              <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-1.5 px-6 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all duration-150 ${isActive ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border hover:border-primary-100 hover:bg-primary-50'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}>
                <TabIcon size={12} strokeWidth={1.5} />
                <span>{cat.shortLabel}</span>
                {!loading && <span className={`text-[10px] px-1 py-0 rounded-xl ${isActive ? 'bg-white/20 text-white' : 'bg-border-light text-text-muted'}`}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-bg rounded-xl p-6.5 flex items-start gap-3 animate-pulse border border-border-light">
                <div className="w-10 h-10 rounded-xl bg-border-light shrink-0" />
                <div className="flex-1"><div className="h-3.5 bg-border-light rounded-xl w-3/4 mb-2" /><div className="h-2.5 bg-border-light rounded-xl w-1/2" /></div>
                <div className="h-4 w-10 bg-border-light rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-3">
            <div className="flex justify-center mb-2"><AlertTriangle size={28} strokeWidth={1.5} className="text-text-muted" /></div>
            <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{error}</p>
            <button onClick={fetchAll} className="mt-3 text-primary text-xs font-semibold cursor-pointer bg-transparent border-0 hover:underline" style={{ fontFamily: "'Inter', sans-serif" }}>Try again →</button>
          </div>
        ) : activePlaces.length === 0 ? (
          <div className="text-center py-3">
            {(() => { const cat = CATEGORIES.find(c => c.id === activeTab); const EIcon = cat?.Icon || Compass; return <div className="flex justify-center mb-2"><EIcon size={28} strokeWidth={1.5} className="text-text-muted opacity-60" /></div>; })()}
            <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>No {CATEGORIES.find(c => c.id === activeTab)?.label.toLowerCase()} found nearby</p>
            <p className="text-text-muted text-xs mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Try checking other categories</p>
          </div>
        ) : (
          activeTab === 'hotel' ? (
            <AccommodationList places={activePlaces} tripId={tripId} destination={destination} />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {activePlaces.map(place => <PlaceCard key={place.id} place={place} />)}
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-2 border-t border-border-light bg-bg">
        <p className="text-[10px] text-text-muted text-center" style={{ fontFamily: "'Inter', sans-serif" }}>Data from OpenStreetMap via Overpass API • Within 3km radius</p>
      </div>
    </div>
  );
}
