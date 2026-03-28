/**
 * NearbyPlaces — Fetches and displays nearby places using Overpass API
 *
 * Categories:
 *   🍽️ Restaurants — amenity=restaurant|cafe|fast_food
 *   🏨 Hotels      — tourism=hotel|guest_house|hostel
 *   🎯 Attractions — tourism=attraction|museum|viewpoint|artwork
 *
 * Fetches within a 3km radius of the trip destination.
 * Displays results in categorized, filterable cards.
 */

import { useState, useEffect, useCallback } from 'react';
import AccommodationList from './AccommodationList';

/* ─── Category Configuration ─── */
const CATEGORIES = [
  {
    id: 'restaurant',
    label: 'Restaurants & Cafés',
    shortLabel: 'Food',
    icon: '🍽️',
    query: '["amenity"~"restaurant|cafe|fast_food"]',
    color: '#EF4444',
    bgLight: 'bg-danger-light',
    textColor: 'text-danger',
  },
  {
    id: 'hotel',
    label: 'Hotels & Stays',
    shortLabel: 'Hotels',
    icon: '🏨',
    query: '["tourism"~"hotel|guest_house|hostel|motel"]',
    color: '#8B5CF6',
    bgLight: 'bg-[#f3e8ff]',
    textColor: 'text-[#8B5CF6]',
  },
  {
    id: 'attraction',
    label: 'Attractions',
    shortLabel: 'Attractions',
    icon: '🎯',
    query: '["tourism"~"attraction|museum|viewpoint|artwork|gallery"]',
    color: '#F59E0B',
    bgLight: 'bg-warning-light',
    textColor: 'text-warning',
  },
];

/* ─── Distance calculator (Haversine formula) ─── */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/* ─── Overpass API fetcher ─── */
async function fetchNearbyPlaces(lat, lon, category, radius = 3000) {
  const query = `
    [out:json][timeout:10];
    (
      node${category.query}(around:${radius},${lat},${lon});
      way${category.query}(around:${radius},${lat},${lon});
    );
    out center 15;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.ok) throw new Error(`Overpass API error: ${response.status}`);

    const data = await response.json();

    return data.elements
      .map((el) => {
        const elLat = el.lat || el.center?.lat;
        const elLon = el.lon || el.center?.lon;
        if (!elLat || !elLon) return null;

        const name = el.tags?.name;
        if (!name) return null;

        const dist = calculateDistance(lat, lon, elLat, elLon);

        return {
          id: el.id,
          name,
          lat: elLat,
          lon: elLon,
          category: category.id,
          categoryLabel: category.shortLabel,
          icon: category.icon,
          distance: formatDistance(dist),
          distanceKm: dist,
          cuisine: el.tags?.cuisine || null,
          stars: el.tags?.stars || null,
          website: el.tags?.website || null,
          phone: el.tags?.phone || null,
          openingHours: el.tags?.opening_hours || null,
          address: el.tags?.['addr:street']
            ? `${el.tags['addr:street']}${el.tags['addr:housenumber'] ? ' ' + el.tags['addr:housenumber'] : ''}`
            : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 15); // Limit to 15 per category
  } catch (err) {
    console.error(`Failed to fetch ${category.label}:`, err);
    return [];
  }
}

/* ═══════════════════════════════════════
   Place Card Component
   ═══════════════════════════════════════ */

function PlaceCard({ place }) {
  return (
    <div
      className="bg-bg rounded-xl p-3.5 border border-border-light hover:border-border hover:bg-white
                 transition-all duration-150 flex items-start gap-3"
    >
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: `${CATEGORIES.find(c => c.id === place.category)?.color}15` }}
      >
        {place.icon}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
          {place.name}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          <span className="text-[10px] text-text-muted font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
            📍 {place.distance}
          </span>
          {place.cuisine && (
            <span className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>
              🍴 {place.cuisine.split(';')[0]}
            </span>
          )}
          {place.stars && (
            <span className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>
              ⭐ {place.stars} star
            </span>
          )}
          {place.address && (
            <span className="text-[10px] text-text-muted truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
              📮 {place.address}
            </span>
          )}
        </div>
      </div>

      {/* Distance badge */}
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-border-light text-text-secondary"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {place.distance}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════
   Main NearbyPlaces Component
   ═══════════════════════════════════════ */

export default function NearbyPlaces({ latitude, longitude, onPlacesLoaded, tripId }) {
  const [places, setPlaces] = useState({
    restaurant: [],
    hotel: [],
    attraction: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('restaurant');

  /* ─── Fetch all categories ─── */
  const fetchAll = useCallback(async () => {
    if (!latitude || !longitude) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        CATEGORIES.map((cat) => fetchNearbyPlaces(latitude, longitude, cat))
      );

      const newPlaces = {
        restaurant: results[0],
        hotel: results[1],
        attraction: results[2],
      };

      setPlaces(newPlaces);

      // Pass all places to parent (for map markers)
      if (onPlacesLoaded) {
        const allPlaces = [...results[0], ...results[1], ...results[2]];
        onPlacesLoaded(allPlaces);
      }
    } catch (err) {
      console.error('Failed to fetch nearby places:', err);
      setError('Could not load nearby places. Please try again later.');
    }

    setLoading(false);
  }, [latitude, longitude, onPlacesLoaded]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ─── No coordinates ─── */
  if (!latitude || !longitude) {
    return (
      <div
        className="bg-card rounded-xl border border-border p-6 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <span className="text-3xl mb-2 block">📍</span>
        <p className="text-navy font-semibold text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Nearby places not available
        </p>
        <p className="text-text-muted text-xs mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
          This trip was created without location coordinates. Create a new trip using location search to see nearby places.
        </p>
      </div>
    );
  }

  const activePlaces = places[activeTab] || [];
  const totalCount = places.restaurant.length + places.hotel.length + places.attraction.length;

  return (
    <div
      className="bg-card rounded-xl overflow-hidden border border-border"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📍</span>
            <h3 className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Nearby Places
            </h3>
            {!loading && (
              <span className="text-[10px] bg-primary-50 text-primary px-2 py-0.5 rounded-full font-semibold"
                style={{ fontFamily: "'Inter', sans-serif" }}>
                {totalCount} found
              </span>
            )}
          </div>
          {/* Refresh button */}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="text-text-muted hover:text-primary text-xs cursor-pointer bg-transparent border-0 transition-colors duration-150 disabled:opacity-50"
            style={{ fontFamily: "'Inter', sans-serif" }}
            aria-label="Refresh nearby places"
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mt-3">
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;
            const count = places[cat.id]?.length || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer
                  border transition-all duration-150
                  ${isActive
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-secondary border-border hover:border-primary-100 hover:bg-primary-50'
                  }
                `}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <span>{cat.icon}</span>
                <span>{cat.shortLabel}</span>
                {!loading && (
                  <span
                    className={`text-[10px] px-1 py-0 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-border-light text-text-muted'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          /* Loading skeletons */
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-bg rounded-xl p-3.5 flex items-start gap-3 animate-pulse border border-border-light">
                <div className="w-10 h-10 rounded-lg bg-border-light shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 bg-border-light rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-border-light rounded w-1/2" />
                </div>
                <div className="h-4 w-10 bg-border-light rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error state */
          <div className="text-center py-6">
            <span className="text-3xl mb-2 block">⚠️</span>
            <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              {error}
            </p>
            <button
              onClick={fetchAll}
              className="mt-3 text-primary text-xs font-semibold cursor-pointer bg-transparent border-0 hover:underline"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Try again →
            </button>
          </div>
        ) : activePlaces.length === 0 ? (
          /* Empty state */
          <div className="text-center py-6">
            <span className="text-3xl mb-2 block">
              {CATEGORIES.find(c => c.id === activeTab)?.icon}
            </span>
            <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              No {CATEGORIES.find(c => c.id === activeTab)?.label.toLowerCase()} found nearby
            </p>
            <p className="text-text-muted text-xs mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              Try checking other categories
            </p>
          </div>
        ) : (
          /* Place lists logic */
          activeTab === 'hotel' ? (
            <AccommodationList places={activePlaces} tripId={tripId} />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {activePlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer attribution */}
      <div className="px-5 py-2 border-t border-border-light bg-bg">
        <p className="text-[10px] text-text-muted text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
          Data from OpenStreetMap via Overpass API • Within 3km radius
        </p>
      </div>
    </div>
  );
}
