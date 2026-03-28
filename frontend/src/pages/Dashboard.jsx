import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2
              className="text-2xl font-bold text-navy"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              My Trips
            </h2>
            <p className="text-text-secondary text-sm mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              Hey, {user?.name}! 👋 Here are your planned trips.
            </p>
          </div>
          <Link
            to="/create-trip"
            id="dashboard-new-trip"
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg font-semibold text-sm no-underline transition-colors duration-150"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            + New Trip
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-4 text-center border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-3xl font-bold text-primary" style={{ fontFamily: "'Poppins', sans-serif" }}>{trips.length}</p>
            <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Total Trips</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-3xl font-bold text-success" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {trips.filter(t => !t.budgetExceeded).length}
            </p>
            <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>On Budget</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-3xl font-bold text-danger" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {trips.filter(t => t.budgetExceeded).length}
            </p>
            <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Over Budget</p>
          </div>
        </div>

        {/* Trip Cards */}
        {loading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="h-5 bg-border-light rounded w-2/3 mb-3" />
                <div className="h-4 bg-border-light rounded w-1/2 mb-4" />
                <div className="h-2 bg-border-light rounded-full w-full mb-3" />
                <div className="h-4 bg-border-light rounded w-3/4 mb-4" />
                <div className="flex gap-2">
                  <div className="h-9 bg-border-light rounded-lg flex-1" />
                  <div className="h-9 bg-border-light rounded-lg w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
              </svg>
            </div>
            <p className="text-navy font-semibold text-lg mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              No trips yet!
            </p>
            <p className="text-text-secondary text-sm mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              Start planning your first adventure
            </p>
            <Link
              to="/create-trip"
              className="inline-block bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-semibold text-sm no-underline transition-colors duration-150"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Plan your first trip →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map(trip => (
              <div
                key={trip._id}
                className="bg-card rounded-xl p-5 border border-border hover:border-primary-100 transition-all duration-200"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-navy text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>{trip.name}</h3>
                    <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>📍 {trip.destination}</p>
                  </div>
                  {trip.budgetExceeded && (
                    <span className="bg-danger-light text-danger text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      ⚠️ Over Budget
                    </span>
                  )}
                </div>

                {/* Budget Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-text-secondary mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <span>Spent: ₹{trip.totalExpense}</span>
                    <span>Budget: ₹{trip.budget}</span>
                  </div>
                  <div className="w-full bg-border-light rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        trip.budgetExceeded ? 'bg-danger' : 'bg-success'
                      }`}
                      style={{
                        width: `${Math.min((trip.totalExpense / trip.budget) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-text-secondary mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span>📅 {new Date(trip.startDate).toLocaleDateString()} → {new Date(trip.endDate).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/trip/${trip._id}`}
                    className="flex-1 text-center bg-primary-50 text-primary py-2 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors duration-150 no-underline"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => deleteTrip(trip._id)}
                    className="bg-danger-light text-danger px-3 py-2 rounded-lg text-sm hover:bg-danger hover:text-white transition-colors duration-150 cursor-pointer border-0"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}