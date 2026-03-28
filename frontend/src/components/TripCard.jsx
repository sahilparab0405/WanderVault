/**
 * TripCard — Boarding Pass Style Trip Card
 *
 * Design inspired by real flight/bus tickets:
 *   LEFT section  → Destination, travel mode icon, dates
 *   DIVIDER       → Dotted tear line
 *   RIGHT section → Budget meter, spent/total, status badge
 *
 * Background: Unsplash destination photo with dark overlay
 * Hover: Card lifts up with shadow transition
 * Buttons: View Details | Itinerary | Delete
 */

import { Link } from 'react-router-dom';

/* ─── Travel Mode Metadata ─── */
const TRAVEL_MODES = {
  flight: { icon: '✈️', label: 'Flight' },
  train: { icon: '🚂', label: 'Train' },
  bus: { icon: '🚌', label: 'Bus' },
  car: { icon: '🚗', label: 'Car' },
};

/* ─── Unsplash image URL helper (no API key needed) ─── */
function getDestinationImageUrl(destination) {
  const query = encodeURIComponent(destination?.split(',')[0]?.trim() || 'travel landscape');
  return `https://source.unsplash.com/600x300/?${query},travel,city`;
}

/* ─── Date formatter ─── */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

/* ─── Budget status helper ─── */
function getBudgetStatus(totalExpense, budget) {
  const percent = (totalExpense / budget) * 100;
  if (percent >= 100) return { label: 'Over Budget', badgeClass: 'bg-danger-light text-danger' };
  if (percent >= 75)  return { label: '75%+ Used', badgeClass: 'bg-warning-light text-warning' };
  return { label: 'On Track', badgeClass: 'bg-success-light text-success' };
}

export default function TripCard({ trip, onDelete }) {
  const mode = TRAVEL_MODES[trip.travelMode] || TRAVEL_MODES.flight;
  const budgetPercent = Math.min((trip.totalExpense / trip.budget) * 100, 100);
  const status = getBudgetStatus(trip.totalExpense, trip.budget);
  const remaining = Math.max(trip.budget - trip.totalExpense, 0);

  // Calculate trip duration
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Determine if trip is upcoming, active, or past
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isUpcoming = startDate > now;
  const isPast = endDate < now;
  const isActive = !isUpcoming && !isPast;

  return (
    <div
      className="group relative bg-card rounded-xl overflow-hidden border border-border
                 hover:border-primary/30 transition-all duration-300"
      style={{
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* ═══ TOP: Destination Photo Strip ═══ */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={getDestinationImageUrl(trip.destination)}
          alt={trip.destination}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(26,43,74,0.3) 0%, rgba(26,43,74,0.75) 100%)',
          }}
        />

        {/* Destination name on photo */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3
            className="text-white text-lg font-bold leading-tight truncate"
            style={{ fontFamily: "'Poppins', sans-serif", textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            {trip.destination}
          </h3>
          <p
            className="text-white/70 text-xs mt-0.5 truncate"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {trip.name}
          </p>
        </div>

        {/* Status badge — top right */}
        <div className="absolute top-3 right-3">
          {isActive ? (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary text-white"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Active
            </span>
          ) : isPast ? (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold bg-text-muted text-white"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Completed
            </span>
          ) : (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent text-white"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Upcoming
            </span>
          )}
        </div>

        {/* Travel mode badge — top left */}
        <div className="absolute top-3 left-3">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-navy backdrop-blur-sm"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {mode.icon} {mode.label}
          </span>
        </div>
      </div>

      {/* ═══ BOARDING PASS BODY ═══ */}
      <div className="px-4 pt-4 pb-3">

        {/* ─── Ticket row: Departure ↔ Destination ─── */}
        <div className="flex items-center justify-between mb-3">
          {/* Left: Dates */}
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
               style={{ fontFamily: "'Inter', sans-serif" }}>
              Depart
            </p>
            <p className="text-sm font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {formatDate(trip.startDate)}
            </p>
          </div>

          {/* Center: connecting flight path */}
          <div className="flex-1 mx-3 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <div className="flex-1 border-t border-dashed border-text-muted" />
            <span className="text-sm">{mode.icon}</span>
            <div className="flex-1 border-t border-dashed border-text-muted" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          </div>

          {/* Right: Return date */}
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
               style={{ fontFamily: "'Inter', sans-serif" }}>
              Return
            </p>
            <p className="text-sm font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {formatDate(trip.endDate)}
            </p>
          </div>
        </div>

        {/* Duration chip */}
        <div className="flex justify-center mb-3">
          <span
            className="bg-bg text-text-secondary text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-border-light"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {duration} {duration === 1 ? 'Day' : 'Days'}
          </span>
        </div>

        {/* ─── Dotted tear line (ticket perforation) ─── */}
        <div className="relative my-3">
          <div className="border-t-2 border-dashed border-border" />
          {/* Left notch */}
          <div
            className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-bg border border-border"
          />
          {/* Right notch */}
          <div
            className="absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-bg border border-border"
          />
        </div>

        {/* ─── Budget section ─── */}
        <div className="mb-3">
          {/* Budget numbers */}
          <div className="flex justify-between items-end mb-1.5">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
                 style={{ fontFamily: "'Inter', sans-serif" }}>
                Spent
              </p>
              <p className="text-base font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
                ₹{trip.totalExpense?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
                 style={{ fontFamily: "'Inter', sans-serif" }}>
                Budget
              </p>
              <p className="text-base font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
                ₹{trip.budget?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Budget progress bar */}
          <div className="w-full bg-border-light rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${
                budgetPercent >= 100 ? 'bg-danger' :
                budgetPercent >= 75 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>

          {/* Status + remaining */}
          <div className="flex justify-between items-center mt-1.5">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.badgeClass}`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {status.label}
            </span>
            <span className="text-[10px] text-text-muted font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              ₹{remaining.toLocaleString()} left
            </span>
          </div>
        </div>

        {/* ─── Action buttons ─── */}
        <div className="flex gap-2 mt-3">
          <Link
            to={`/trip/${trip._id}`}
            className="flex-1 text-center bg-primary hover:bg-primary-dark text-white py-2 rounded-lg text-xs font-semibold
                       transition-colors duration-150 no-underline"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            View Details
          </Link>
          <Link
            to={`/trip/${trip._id}/itinerary`}
            className="flex-1 text-center bg-primary-50 text-primary py-2 rounded-lg text-xs font-semibold
                       hover:bg-primary-100 transition-colors duration-150 no-underline"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            📅 Itinerary
          </Link>
          <button
            onClick={() => onDelete(trip._id)}
            className="w-9 h-9 flex items-center justify-center bg-border-light text-text-muted rounded-lg
                       hover:bg-danger-light hover:text-danger transition-colors duration-150 cursor-pointer border-0 text-xs shrink-0"
            aria-label="Delete trip"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
