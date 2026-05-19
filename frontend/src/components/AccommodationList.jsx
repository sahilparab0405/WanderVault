import { useState, useMemo } from 'react';
import API from '../api/axios';
import PromptModal from './PromptModal';
import { Wifi, Bath, Flame, ParkingCircle, Star, MapPin, CheckCircle2, Building2, SlidersHorizontal, Trophy, Car, Waves, Utensils, Wind } from 'lucide-react';

/* ══════════════════════════════════════════════════════
   CITY TIER PRICING DATA (Area 1 — Price Pulse)
══════════════════════════════════════════════════════ */
const CITY_TIERS = {
  tier1: {
    cities: ['paris', 'london', 'dubai', 'singapore', 'new york', 'tokyo', 'sydney', 'mumbai', 'delhi', 'bangalore'],
    range: '₹8,000 – ₹25,000',
    label: 'per night'
  },
  tier2: {
    cities: ['goa', 'jaipur', 'bangkok', 'bali', 'phuket', 'kuala lumpur', 'colombo', 'kathmandu', 'pune', 'hyderabad', 'chennai', 'kolkata'],
    range: '₹3,000 – ₹8,000',
    label: 'per night'
  },
  tier3: {
    cities: ['manali', 'shimla', 'rishikesh', 'mcleod ganj', 'coorg', 'munnar', 'ooty', 'lonavala', 'mahabaleshwar'],
    range: '₹1,500 – ₹4,000',
    label: 'per night'
  }
};

function detectCityTier(destination) {
  if (!destination) return CITY_TIERS.tier2;
  const dest = destination.toLowerCase();
  for (const [, tier] of Object.entries(CITY_TIERS)) {
    if (tier.cities.some(city => dest.includes(city))) return tier;
  }
  return CITY_TIERS.tier2;
}

/* ── Amenity mapping from Overpass tags ── */
const TAG_AMENITIES = [
  { tagKey: 'internet_access', Icon: Wifi, label: 'Wifi' },
  { tagKey: 'parking',         Icon: Car,  label: 'Parking' },
  { tagKey: 'swimming_pool',   Icon: Waves, label: 'Pool' },
  { tagKey: 'restaurant',      Icon: Utensils, label: 'Dining' },
  { tagKey: 'air_conditioning', Icon: Wind, label: 'AC' },
];

/* ─── Deterministic stats from OSM/Fallback ─── */
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

/* ─── Fallback amenity icons deterministically assigned ─── */
const AMENITIES_POOL = [
  { Icon: Wifi,          label: 'Wifi' },
  { Icon: Bath,          label: 'Tub' },
  { Icon: Flame,         label: 'BBQ' },
  { Icon: ParkingCircle, label: 'Parking' },
];

function getFallbackAmenities(hash) {
  const count = 3 + (hash % 2);
  return AMENITIES_POOL.slice(0, count);
}

/* ─── Get amenities from Overpass tags or fallback ─── */
function getAmenities(place) {
  // If the place object has raw Overpass tags, extract real amenities
  if (place.tags && typeof place.tags === 'object') {
    const found = [];
    for (const { tagKey, Icon, label } of TAG_AMENITIES) {
      if (place.tags[tagKey] && place.tags[tagKey] !== 'no') {
        found.push({ Icon, label });
      }
    }
    if (found.length > 0) return found.slice(0, 4);
  }
  // Fallback: deterministic from hash
  const hash = place.hash || (String(place.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) + place.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  return getFallbackAmenities(hash);
}

/* ─── Value Score Algorithm (Area 1 — Addition 1) ─── */
function computeValueScore(place) {
  const stars = parseFloat(place.tags?.stars) || 0;
  const distanceKm = place.distanceKm || parseFloat(place.distance) || 2;
  
  // Count amenities from tags
  let amenitiesCount = 0;
  if (place.tags && typeof place.tags === 'object') {
    for (const { tagKey } of TAG_AMENITIES) {
      if (place.tags[tagKey] && place.tags[tagKey] !== 'no') amenitiesCount++;
    }
  } else {
    // Fallback: use hash to simulate
    const hash = place.hash || 0;
    amenitiesCount = 2 + (hash % 3);
  }

  return (stars * 20) + (100 - distanceKm * 10) + (amenitiesCount * 5);
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

/* ─── Price Pulse Card (Area 1 — Addition 2) ─── */
function PricePulseCard({ destination }) {
  const tier = detectCityTier(destination);
  const cityName = destination ? destination.split(',')[0] : 'your destination';

  return (
    <div className="bg-white rounded-xl border border-border p-6 flex items-center gap-4 mb-4"
         style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
        <Building2 size={20} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>
          Estimated stay cost in <span className="font-bold text-navy">{cityName}</span>
        </p>
        <p className="text-lg font-black text-navy leading-tight mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {tier.range}
        </p>
        <p className="text-[10px] text-text-muted mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
          {tier.label} — Prices vary by season and availability
        </p>
      </div>
    </div>
  );
}

/* ─── Value Badge ─── */
function ValueBadge({ rank }) {
  if (rank === 0) {
    return (
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-navy text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md">
        <Trophy size={11} strokeWidth={2} /> Best Value
      </div>
    );
  }
  if (rank === 1) {
    return (
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md"
           style={{ backgroundColor: '#FF6B35' }}>
        <Star size={11} strokeWidth={2} /> Recommended
      </div>
    );
  }
  return null;
}

/* ─── Hotel Card (reference: feature_6_accommodation) ─── */
function AccommodationCard({ place, stats, tripId, valueRank }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const amenities = getAmenities(place);

  const handleConfirm = async (dayInput) => {
    setShowPrompt(false);
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
    <div className="bg-white rounded-xl overflow-hidden border border-border group hover:-translate-y-1 transition-all duration-300"
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
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-xl shadow-md">
          <Star size={11} fill="#F59E0B" strokeWidth={0} />
          <span className="text-xs font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {stats.rating}
          </span>
        </div>
        {/* Value badge (Area 1 — Addition 1) */}
        <ValueBadge rank={valueRank} />
      </div>

      {/* ── Card body ── */}
      <div className="p-6">
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

        {/* Amenities row (Area 1 — Addition 3: real Overpass amenities) */}
        <div className="flex items-center gap-4 mb-4 py-3 border-t border-b border-border-light">
          {/* eslint-disable-next-line no-unused-vars */}
          {amenities.map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon size={14} strokeWidth={1.5} className="text-text-secondary" />
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
            onClick={() => setShowPrompt(true)}
            disabled={saving || saved}
            id={`hotel-book-${place.id}`}
            className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 border-0 cursor-pointer
              ${saved ? 'bg-success text-white' : 'bg-accent hover:bg-accent-dark text-white'}
              disabled:opacity-75`}
            style={{ fontFamily: "'Inter', sans-serif", boxShadow: saved ? 'none' : '0 3px 10px rgba(255,107,53,0.35)' }}
          >
            {saving ? (
              <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-xl animate-spin" />Saving...</>
            ) : saved ? (
              <><CheckCircle2 size={13} strokeWidth={2} />Saved</>
            ) : (
              <>Check availability →</>
            )}
          </button>
        </div>
      </div>
      {showPrompt && <PromptModal title={`Book ${place.name}`} message={`Which day of your trip to stay at ${place.name}? (e.g., 1)`} defaultValue="1" onConfirm={handleConfirm} onCancel={() => setShowPrompt(false)} />}
    </div>
  );
}

/* ─── Main AccommodationList ─── */
export default function AccommodationList({ places, tripId, destination }) {
  const [filterBudget, setFilterBudget] = useState('All');
  const [filterRating, setFilterRating] = useState('All');
  const [filterDist, setFilterDist] = useState('All');

  const items = useMemo(() => {
    return places.map(p => ({ place: p, stats: getHotelStats(p), valueScore: computeValueScore(p) }))
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
      .sort((a, b) => b.valueScore - a.valueScore); // Sort by value score descending
  }, [places, filterBudget, filterRating, filterDist]);

  return (
    <div className="space-y-4">
      {/* ── Price Pulse Card (Area 1 — Addition 2) ── */}
      {destination && <PricePulseCard destination={destination} />}

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-border p-6 rounded-xl"
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
            className="bg-bg border border-border text-navy text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
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
          {items.map(({ place, stats }, idx) => (
            <AccommodationCard key={place.id} place={place} stats={stats} tripId={tripId} valueRank={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
