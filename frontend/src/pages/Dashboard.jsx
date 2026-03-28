import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TripCard from '../components/TripCard';
import { TripCardSkeleton, StatCardSkeleton } from '../components/Skeleton';

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const deleteTrip = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await API.delete(`/trips/${id}`);
      setTrips(trips.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  /* ─── Computed stats ─── */
  const totalSpent = trips.reduce((sum, t) => sum + (t.totalExpense || 0), 0);
  const onBudget = trips.filter(t => !t.budgetExceeded).length;
  const overBudget = trips.filter(t => t.budgetExceeded).length;

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1
              className="text-2xl font-bold text-navy"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              My Trips
            </h1>
            <p className="text-text-secondary text-sm mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              Hey, {user?.name}! 👋 Here are your planned trips.
            </p>
          </div>
          <Link
            to="/create-trip"
            id="dashboard-new-trip"
            className="bg-accent hover:bg-accent-dark text-white px-5 py-2.5 rounded-lg font-semibold text-sm no-underline transition-colors duration-150 flex items-center gap-1.5 shrink-0"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1V13M1 7H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Plan New Trip
          </Link>
        </div>

        {/* Stats Row */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-card rounded-xl p-4 text-center border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="text-3xl font-bold text-primary" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {trips.length}
              </p>
              <p className="text-text-secondary text-xs mt-1 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                Total Trips
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 text-center border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="text-3xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
                ₹{totalSpent.toLocaleString()}
              </p>
              <p className="text-text-secondary text-xs mt-1 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                Total Spent
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 text-center border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="text-3xl font-bold text-success" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {onBudget}
              </p>
              <p className="text-text-secondary text-xs mt-1 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                On Budget
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 text-center border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="text-3xl font-bold text-danger" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {overBudget}
              </p>
              <p className="text-text-secondary text-xs mt-1 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                Over Budget
              </p>
            </div>
          </div>
        )}

        {/* Trip Cards */}
        {loading ? (
          /* Loading Skeleton Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => <TripCardSkeleton key={i} />)}
          </div>
        ) : trips.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-card rounded-xl border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
              </svg>
            </div>
            <h3 className="text-navy font-bold text-xl mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              No trips planned yet
            </h3>
            <p className="text-text-secondary text-sm mb-5 max-w-xs mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
              Ready for your next adventure? Create your first trip and start tracking your travel budget.
            </p>
            <Link
              to="/create-trip"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold text-sm no-underline transition-colors duration-150"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1V13M1 7H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Plan Your First Trip
            </Link>
          </div>
        ) : (
          /* Boarding Pass Trip Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {trips.map(trip => (
              <TripCard
                key={trip._id}
                trip={trip}
                onDelete={deleteTrip}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}