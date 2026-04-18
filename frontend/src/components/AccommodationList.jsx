import { useState, useMemo } from 'react';
import API from '../api/axios';
import { Wifi, Bath, Flame, ParkingCircle, Star, MapPin, CheckCircle2, Building2, SlidersHorizontal } from 'lucide-react';

/* ─── Deterministic stats from FSQ fallback ─── */
function getHotelStats(place) {
  if (place.hash === 1234 || !place.image) {
     const hash = place.hash || (String(place.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) + place.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
     const images = [
       'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=360&fit=crop&q=80',
       'https://images.unsplash.com/photo-1551882547-ff40c0d1398c?w=600&h=360&fit=crop&q=80',
       'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600&h=360&fit=crop&q=80',
       'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=600&h=360&fit=crop&q=80',
     ];
     place.image = images[hash % images.length];
  }
  
  let budgetLevel = '₹';
  if (place.price > 6000) budgetLevel = '₹₹₹';
  else if (place.price > 3500) budgetLevel = '₹₹';
  
  return { price: place.price, rating: place.rating, budgetLevel, image: place.image };
}

/* ─── Amenity icons deterministically assigned ─── */
const AMENITIES_POOL = [
  { Icon: Wifi,          label: 'Wifi' },
  { Icon: Bath,          label: 'Tub' },
  { Icon: Flame,         label: 'BBQ' },
  { Icon: ParkingCircle, label: 'Parking' },
];

function getAmenities(hash) {
  // Show 3-4 amenities based on hash
  const count = 3 + (hash % 2);
  return AMENITIES_POOL.slice(0, count);
}

/* ─── Star Rating ─── */
function StarRating({ rating }) {
  const r = parseFloat(rating);
  const full = Math.floor(r);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          strokeWidth={0}
          fill={i < full ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
      <span className="text-xs font-semibold text-navy ml-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
        {rating}
      </span>
    </div>
  );
}

/* ─── Hotel Card (reference: feature_6_accommodation) ─── */
function AccommodationCard({ place, stats, tripId }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hash = String(place.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
             + place.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const amenities = getAmenities(hash);

  const handleSave = async () => {
    if (!tripId) return;
    const dayInput = window.prompt(`Which day of your trip to stay at ${place.name}? (e.g., 1)`);
    if (!dayInput) return;
    const day = parseInt(dayInput, 10);
    if (isNaN(day) || day < 1) { alert('Enter a valid day number.'); return; }
    setSaving(true);
    try {
      await API.post(`/itinerary/${tripId}`, {
        day, title: `Stay: ${place.name}`,
        location: place.address || place.name,
        description: `Accommodation booking for ₹${stats.price}/night.`,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); alert('Failed to save hotel. Check server.'); }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border group hover:-translate-y-1 transition-all duration-300"
         style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* ── Photo strip ── */}
      <div className="relative h-44 overflow-hidden bg-border-light">
        <img
          src={stats.image} alt={place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(place.name)}&background=f3f4f6&color=1a2b4a&size=600`; }}
        />
        {/* Rating badge overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-md">
          <Star size={11} fill="#F59E0B" strokeWidth={0} />
          <span className="text-xs font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {stats.rating}
          </span>
        </div>
        {/* Budget tier badge */}
        <div className="absolute top-3 left-3 bg-navy/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {stats.budgetLevel}
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-4">
        {/* Hotel name + location */}
        <h4 className="font-bold text-navy text-sm leading-snug mb-0.5 line-clamp-1"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
          {place.name}
        </h4>
        <p className="text-[11px] text-text-muted flex items-center gap-1 mb-3"
           style={{ fontFamily: "'Inter', sans-serif" }}>
          <MapPin size={10} strokeWidth={1.5} className="text-accent shrink-0" />
          {place.distance} away{place.address ? ` · ${place.address.slice(0, 28)}…` : ''}
        </p>

        {/* Amenities row */}
        <div className="flex items-center gap-4 mb-4 py-3 border-t border-b border-border-light">
          {amenities.map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon size={16} strokeWidth={1.5} className="text-text-secondary" />
              <span className="text-[9px] text-text-muted font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-text-muted mb-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Per night</p>
            <p className="text-xl font-bold text-navy leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ₹{stats.price.toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            id={`hotel-book-${place.id}`}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 border-0 cursor-pointer
              ${saved ? 'bg-success text-white' : 'bg-accent hover:bg-accent-dark text-white'}
              disabled:opacity-75`}
            style={{ fontFamily: "'Inter', sans-serif", boxShadow: saved ? 'none' : '0 3px 10px rgba(255,107,53,0.35)' }}
          >
            {saving ? (
              <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
            ) : saved ? (
              <><CheckCircle2 size={13} strokeWidth={2} />Saved</>
            ) : (
              <>Check availability →</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main AccommodationList ─── */
export default function AccommodationList({ places, tripId }) {
  const [filterBudget, setFilterBudget] = useState('All');
  const [filterRating, setFilterRating] = useState('All');
  const [filterDist, setFilterDist] = useState('All');

  const items = useMemo(() => {
    return places.map(p => ({ place: p, stats: getHotelStats(p) }))
      .filter(({ place, stats }) => {
        if (filterBudget !== 'All' && stats.budgetLevel !== filterBudget) return false;
        if (filterRating !== 'All') {
          const r = parseFloat(stats.rating);
          if (filterRating === '3+' && r < 3.0) return false;
          if (filterRating === '4+' && r < 4.0) return false;
          if (filterRating === '4.5+' && r < 4.5) return false;
        }
        if (filterDist !== 'All') {
          if (filterDist === '< 1km' && place.distanceKm > 1) return false;
          if (filterDist === '< 2km' && place.distanceKm > 2) return false;
          if (filterDist === '< 5km' && place.distanceKm > 5) return false;
        }
        return true;
      })
      .sort((a, b) => a.place.distanceKm - b.place.distanceKm);
  }, [places, filterBudget, filterRating, filterDist]);

  return (
    <div className="space-y-4">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-border p-3 rounded-xl"
           style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center gap-1.5 text-text-muted mr-1">
          <SlidersHorizontal size={12} strokeWidth={1.5} />
          <span className="text-[10px] uppercase font-bold tracking-wider"
                style={{ fontFamily: "'Inter', sans-serif" }}>Filters</span>
        </div>
        {[
          { label: 'Budget', value: filterBudget, onChange: setFilterBudget, options: [['All','All'],['₹','₹ Economy'],['₹₹','₹₹ Standard'],['₹₹₹','₹₹₹ Premium']] },
          { label: 'Rating', value: filterRating, onChange: setFilterRating, options: [['All','Rating: All'],['3+','3+ Stars'],['4+','4+ Stars'],['4.5+','4.5+ Stars']] },
          { label: 'Distance', value: filterDist, onChange: setFilterDist, options: [['All','Dist: All'],['< 1km','< 1 km'],['< 2km','< 2 km'],['< 5km','< 5 km']] },
        ].map(({ label, value, onChange, options }) => (
          <select key={label} value={value} onChange={e => onChange(e.target.value)}
            className="bg-bg border border-border text-navy text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        {(filterBudget !== 'All' || filterRating !== 'All' || filterDist !== 'All') && (
          <button onClick={() => { setFilterBudget('All'); setFilterRating('All'); setFilterDist('All'); }}
            className="text-[10px] text-accent font-semibold bg-transparent border-0 cursor-pointer hover:underline ml-auto"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            Clear all
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {items.length === 0 ? (
        <div className="py-12 text-center">
          <Building2 size={32} strokeWidth={1.5} className="text-text-muted mx-auto mb-3 opacity-50" />
          <p className="text-sm text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>
            No accommodations match your filters.
          </p>
          <button onClick={() => { setFilterBudget('All'); setFilterRating('All'); setFilterDist('All'); }}
            className="mt-2 text-xs text-primary font-semibold bg-transparent border-0 cursor-pointer hover:underline"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[680px] overflow-y-auto pr-1">
          {items.map(({ place, stats }) => (
            <AccommodationCard key={place.id} place={place} stats={stats} tripId={tripId} />
          ))}
        </div>
      )}
    </div>
  );
}
