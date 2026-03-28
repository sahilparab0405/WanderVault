import { useState, useMemo } from 'react';
import API from '../api/axios';

/* ─── Deterministic Mock Data Generator ─── */
function getHotelStats(id, name) {
  // Simple hash of OSM ID and name sum
  const hash = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) +
               name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Pseudo-random price: ₹800 to ₹5500, rounded to nearest 50
  const priceRaw = 800 + (hash % 4700);
  const price = Math.round(priceRaw / 50) * 50;
  
  // Pseudo-random rating: 3.0 to 5.0
  const rating = 3.0 + ((hash % 20) / 10);
  
  // Determine budget level based on price
  let budgetLevel = '₹';
  if (price > 3500) budgetLevel = '₹₹₹';
  else if (price > 1800) budgetLevel = '₹₹';

  // Deterministic images (Pool of high-quality Unsplash hotel room photos)
  const images = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c0d1398c?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop&q=80',
  ];
  const image = images[hash % images.length];

  return { price, rating: rating.toFixed(1), budgetLevel, image };
}

/* ═══════════════════════════════════════
   Accommodation Card Component 
   (OYO Inspired Layout)
   ═══════════════════════════════════════ */

function AccommodationCard({ place, stats, tripId }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Generate full stars array based on rating
  const renderStars = (rating) => {
    const r = parseFloat(rating);
    const fullStars = Math.floor(r);
    const hasHalf = r - fullStars >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) stars.push('⭐');
      else if (i === fullStars && hasHalf) stars.push('⭐'); // Placeholder for half-star symbol if needed
      else stars.push('☆☆');
    }
    return (
      <div className="flex items-center gap-1 text-[10px] sm:text-xs tracking-wider" style={{ fontFamily: "'Inter', sans-serif", color: '#F59E0B' }}>
        {stars.map((s, idx) => (
          <span key={idx}>{s}</span>
        ))}
        <span className="text-text-muted font-medium ml-1">({rating})</span>
      </div>
    );
  };

  const handleSaveToTrip = async () => {
    if (!tripId) {
      alert("Error: tripId is missing.");
      return;
    }
    
    // Quick prompt to ask for day directly inline, 
    // simulating a seamless save for internship demo
    const dayInput = window.prompt(`Which day of your trip to stay at ${place.name}? (e.g., 1)`);
    if (!dayInput) return; // User cancelled

    const dayNumber = parseInt(dayInput, 10);
    if (isNaN(dayNumber) || dayNumber < 1) {
      alert("Please enter a valid day number.");
      return;
    }

    setSaving(true);
    try {
      await API.post(`/itinerary/${tripId}`, {
        day: dayNumber,
        title: `Stay: ${place.name}`,
        location: place.address || place.name,
        description: `Accommodation booking for ₹${stats.price}/Night.`,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save hotel to itinerary. Ensure backend is running.');
    }
    setSaving(false);
  };

  return (
    <div 
      className="bg-card rounded-xl border border-border flex flex-col sm:flex-row overflow-hidden hover:-translate-y-1 transition-transform duration-300 group"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* ─── Left: Photo ─── */}
      <div className="w-full sm:w-40 h-40 sm:h-auto shrink-0 relative overflow-hidden bg-bg">
        <img 
          src={stats.image} 
          alt={place.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80' }}
        />
        {/* Rating overlay flag */}
        <div className="absolute top-3 left-0 bg-success text-white px-2 py-0.5 rounded-r-md text-[10px] font-bold shadow-md" style={{ fontFamily: "'Inter', sans-serif" }}>
          {stats.rating} / 5
        </div>
      </div>

      {/* ─── Right: Details ─── */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="relative">
          {/* Header Area */}
          <div className="pr-16">
            <h4 className="text-sm font-bold text-navy mb-0.5 line-clamp-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {place.name}
            </h4>
            {renderStars(stats.rating)}
          </div>

          {/* Price Badge Top-Right */}
          <div className="absolute top-0 right-0 text-right">
            <p className="text-xs text-text-muted line-through mb-0" style={{ fontFamily: "'Inter', sans-serif" }}>
              ₹{Math.round(stats.price * 1.35).toLocaleString()}
            </p>
            <p className="text-lg font-bold text-navy leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ₹{stats.price.toLocaleString()}
            </p>
            <p className="text-[9px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>per night</p>
          </div>
        </div>

        {/* Bottom Area */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-bg py-0.5 px-2 rounded-full font-medium text-text-secondary border border-border-light" style={{ fontFamily: "'Inter', sans-serif" }}>
                📍 {place.distance} from center
              </span>
              <span className="text-[10px] bg-bg py-0.5 px-2 rounded-full font-medium text-text-secondary border border-border-light" style={{ fontFamily: "'Inter', sans-serif" }}>
                {stats.budgetLevel}
              </span>
            </div>
            {place.address && (
              <p className="text-[10px] text-text-muted line-clamp-1 max-w-[200px]" style={{ fontFamily: "'Inter', sans-serif" }}>
                {place.address}
              </p>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleSaveToTrip}
            disabled={saving || saved}
            className={`
              shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 border-0 cursor-pointer
              ${saved ? 'bg-success text-white' : 'bg-accent hover:bg-accent-dark text-white'}
              disabled:opacity-80
            `}
            style={{ fontFamily: "'Inter', sans-serif", minWidth: '110px' }}
          >
            {saving ? '⏳ Saving...' : saved ? '✓ Saved!' : '+ Save to Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Main Component: AccommodationList
   ═══════════════════════════════════════ */

export default function AccommodationList({ places, tripId }) {
  const [filterBudget, setFilterBudget] = useState('All');
  const [filterRating, setFilterRating] = useState('All');
  const [filterDist, setFilterDist] = useState('All');

  // Compute stats once correctly and filter
  const items = useMemo(() => {
    return places.map(p => ({
      place: p,
      stats: getHotelStats(p.id, p.name)
    })).filter(item => {
      // Flow checking filters
      // Budget
      if (filterBudget !== 'All' && item.stats.budgetLevel !== filterBudget) return false;
      
      // Rating
      if (filterRating !== 'All') {
        const r = parseFloat(item.stats.rating);
        if (filterRating === '3+' && r < 3.0) return false;
        if (filterRating === '4+' && r < 4.0) return false;
        if (filterRating === '4.5+' && r < 4.5) return false;
      }
      
      // Distance
      if (filterDist !== 'All') {
        if (filterDist === '< 1km' && item.place.distanceKm > 1) return false;
        if (filterDist === '< 2km' && item.place.distanceKm > 2) return false;
        if (filterDist === '< 5km' && item.place.distanceKm > 5) return false;
      }

      return true;
    }).sort((a, b) => a.place.distanceKm - b.place.distanceKm); // Ordered by proximity by default
  }, [places, filterBudget, filterRating, filterDist]);

  return (
    <div className="space-y-4">
      {/* ─── Filter Bar ─── */}
      <div className="flex flex-wrap items-center gap-3 bg-bg border border-border-light p-3 rounded-xl shadow-sm">
        <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider mr-1" style={{ fontFamily: "'Inter', sans-serif" }}>
          Filters
        </span>
        
        {/* Budget Filter */}
        <select 
          value={filterBudget} 
          onChange={(e) => setFilterBudget(e.target.value)}
          className="bg-white border text-navy border-border text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <option value="All">Budget: All</option>
          <option value="₹">₹ (Economy)</option>
          <option value="₹₹">₹₹ (Standard)</option>
          <option value="₹₹₹">₹₹₹ (Premium)</option>
        </select>

        {/* Rating Filter */}
        <select 
          value={filterRating} 
          onChange={(e) => setFilterRating(e.target.value)}
          className="bg-white border text-navy border-border text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <option value="All">Rating: All</option>
          <option value="3+">3.0+ Stars</option>
          <option value="4+">4.0+ Stars</option>
          <option value="4.5+">4.5+ Stars</option>
        </select>

        {/* Distance Filter */}
        <select 
          value={filterDist} 
          onChange={(e) => setFilterDist(e.target.value)}
          className="bg-white border text-navy border-border text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <option value="All">Dist: All</option>
          <option value="< 1km">&lt; 1 km</option>
          <option value="< 2km">&lt; 2 km</option>
          <option value="< 5km">&lt; 5 km</option>
        </select>
      </div>

      {/* ─── Listings ─── */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <span className="text-3xl block mb-2">🏨</span>
            <p className="text-sm text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>No accommodations match your filters.</p>
            <button 
              onClick={() => { setFilterBudget('All'); setFilterRating('All'); setFilterDist('All'); }}
              className="mt-2 text-xs text-primary font-semibold bg-transparent border-0 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          items.map((item) => (
            <AccommodationCard 
              key={item.place.id} 
              place={item.place} 
              stats={item.stats} 
              tripId={tripId} 
            />
          ))
        )}
      </div>
    </div>
  );
}
