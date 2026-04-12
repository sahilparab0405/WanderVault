import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TripCard from '../components/TripCard';
import { TripCardSkeleton, StatCardSkeleton } from '../components/Skeleton';
import { Plane, DollarSign, Shield, AlertTriangle, Search, BarChart2 } from 'lucide-react';

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data } = await API.get('/trips');
      setTrips(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/trips/${deleteTarget.id}`);
      setTrips(trips.filter(t => t._id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  /* ─── Computed stats ─── */
  const totalSpent = trips.reduce((sum, t) => sum + (t.totalExpense || 0), 0);
  const onBudget = trips.filter(t => !t.budgetExceeded).length;
  const overBudget = trips.filter(t => t.budgetExceeded).length;

  /* ─── Search Filtering ─── */
  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const lowerQ = searchQuery.toLowerCase();
    return trips.filter(t =>
      t.name.toLowerCase().includes(lowerQ) ||
      t.destination.toLowerCase().includes(lowerQ)
    );
  }, [trips, searchQuery]);

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ─── Hero Section & Quick Actions ─── */}
        <div className="mb-10 bg-white p-6 sm:p-8 rounded-2xl border border-border-light relative overflow-hidden"
             style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-navy tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                My Trips
              </h1>
              <p className="text-text-secondary mt-2 text-sm sm:text-base max-w-lg leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                Manage your itineraries, track expenses, and discover nearby places across all your upcoming trips.
              </p>

              {/* Search Bar */}
              <div className="mt-6 max-w-md relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  placeholder="Search by destination or trip name..."
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-bg border border-border-light rounded-xl text-navy text-sm font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <Link
                to="/create-trip"
                className="group flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 border-0 focus:ring-4 focus:ring-accent/20"
                style={{ fontFamily: "'Inter', sans-serif", boxShadow: 'var(--shadow-md)' }}
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:rotate-90">
                  <span className="text-white text-lg leading-none mt-[-2px]">+</span>
                </div>
                Create Itinerary
              </Link>
              <Link
                to="/budget-demo"
                className="flex items-center justify-center gap-2 bg-white hover:bg-bg border border-border-light hover:border-border text-navy px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                style={{ fontFamily: "'Inter', sans-serif", boxShadow: 'var(--shadow-sm)' }}
              >
                <BarChart2 size={16} strokeWidth={1.5} />
                Budget Overview
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <h3 className="text-lg font-bold text-navy mb-4 px-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Overview</h3>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
            {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
            <div className="bg-white rounded-2xl p-3 sm:p-5 border border-border transition-all hover:border-primary-100 flex flex-col relative overflow-hidden group" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary mb-3">
                <Plane size={20} strokeWidth={1.5} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>{trips.length}</p>
              <p className="text-text-secondary text-xs sm:text-sm mt-0.5 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Total Trips</p>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-5 border border-border transition-all hover:border-primary-100 flex flex-col relative overflow-hidden group" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="w-10 h-10 rounded-full bg-navy/5 flex items-center justify-center text-navy mb-3">
                <DollarSign size={20} strokeWidth={1.5} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-navy uppercase" style={{ fontFamily: "'Poppins', sans-serif" }}>
                ₹{totalSpent >= 1000 ? (totalSpent / 1000).toFixed(1) + 'K' : totalSpent}
              </p>
              <p className="text-text-secondary text-xs sm:text-sm mt-0.5 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Total Spent</p>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-navy/5 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-5 border border-border transition-all hover:border-success/30 flex flex-col relative overflow-hidden group" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success mb-3">
                <Shield size={20} strokeWidth={1.5} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-success" style={{ fontFamily: "'Poppins', sans-serif" }}>{onBudget}</p>
              <p className="text-text-secondary text-xs sm:text-sm mt-0.5 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>On Budget</p>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-success/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-5 border border-border transition-all hover:border-danger/30 flex flex-col relative overflow-hidden group" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-3">
                <AlertTriangle size={20} strokeWidth={1.5} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-danger" style={{ fontFamily: "'Poppins', sans-serif" }}>{overBudget}</p>
              <p className="text-text-secondary text-xs sm:text-sm mt-0.5 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Over Budget</p>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-danger/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
            </div>
          </div>
        )}

        {/* ─── Trip Cards ─── */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Your Itineraries</h3>
          {!loading && trips.length > 0 && searchQuery && (
            <span className="text-xs font-semibold text-text-muted bg-border-light px-2 py-1 rounded-md">
              {filteredTrips.length} results found
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {[1, 2, 3, 4].map(i => <TripCardSkeleton key={i} />)}
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {filteredTrips.map(trip => (
              <TripCard
                key={trip._id}
                trip={trip}
                onDelete={(id) => setDeleteTarget({ id, name: trip.name })}
              />
            ))}
          </div>
        ) : trips.length > 0 && filteredTrips.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border-light">
            <div className="flex justify-center mb-3">
              <Search size={36} strokeWidth={1.5} className="text-text-muted opacity-60" />
            </div>
            <h4 className="text-navy font-bold text-lg mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>No matches found</h4>
            <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Try adjusting your search query.</p>
          </div>
        ) : (
          /* Global Empty State */
          <div className="relative overflow-hidden text-center py-20 px-4 bg-white rounded-3xl border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="absolute inset-0 bg-primary/5 point-events-none" style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 mb-6 rounded-full bg-primary-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-navy">
                  <path d="M12 11.5C11.337 11.5 10.8 10.963 10.8 10.3C10.8 9.637 11.337 9.1 12 9.1C12.663 9.1 13.2 9.637 13.2 10.3C13.2 10.963 12.663 11.5 12 11.5Z" fill="currentColor"/>
                  <path d="M12 2C7.589 2 4 5.589 4 9.995C3.971 16.44 11.696 21.784 12 22C12 22 20.029 16.44 20 9.995C20 5.589 16.411 2 12 2ZM12 13.5C10.234 13.5 8.8 12.066 8.8 10.3C8.8 8.534 10.234 7.1 12 7.1C13.766 7.1 15.2 8.534 15.2 10.3C15.2 12.066 13.766 13.5 12 13.5Z" fill="var(--color-primary)"/>
                </svg>
              </div>
              <h3 className="text-navy font-bold text-2xl sm:text-3xl mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                No active trips
              </h3>
              <p className="text-text-secondary text-sm sm:text-base mb-8 max-w-sm mx-auto leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                No trips found. Create your first itinerary to get started.
              </p>
              <Link
                to="/create-trip"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-bold text-sm sm:text-base no-underline transition-transform hover:-translate-y-1 hover:shadow-lg focus:ring-4 focus:ring-accent/20"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg leading-none mt-[-2px]">+</span>
                </div>
                Plan your first trip
              </Link>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border" style={{ fontFamily: "'Inter', sans-serif" }}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-danger/10 text-danger mb-4 mx-auto">
                <AlertTriangle size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-navy text-center mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Delete Trip
              </h3>
              <p className="text-text-secondary text-center mb-6">
                Are you sure you want to delete <strong className="text-navy">{deleteTarget.name}</strong>?<br/>This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold border border-border text-navy bg-white hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold border border-danger text-white bg-danger hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}