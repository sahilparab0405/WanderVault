import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">🌍 WanderVault</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">Hey, {user?.name}! 👋</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Trips</h2>
          <Link
            to="/create-trip"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            + New Trip
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-blue-600">{trips.length}</p>
            <p className="text-gray-500 text-sm mt-1">Total Trips</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600">
              {trips.filter(t => !t.budgetExceeded).length}
            </p>
            <p className="text-gray-500 text-sm mt-1">On Budget</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-red-500">
              {trips.filter(t => t.budgetExceeded).length}
            </p>
            <p className="text-gray-500 text-sm mt-1">Over Budget</p>
          </div>
        </div>

        {/* Trip Cards */}
        {loading ? (
          <p className="text-center text-gray-400 py-12">Loading trips...</p>
        ) : trips.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-5xl mb-4">✈️</p>
            <p className="text-gray-500 text-lg">No trips yet!</p>
            <Link to="/create-trip" className="text-blue-600 font-medium hover:underline mt-2 block">
              Create your first trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map(trip => (
              <div key={trip._id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{trip.name}</h3>
                    <p className="text-gray-500 text-sm">📍 {trip.destination}</p>
                  </div>
                  {trip.budgetExceeded && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                      ⚠️ Over Budget
                    </span>
                  )}
                </div>

                {/* Budget Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Spent: ₹{trip.totalExpense}</span>
                    <span>Budget: ₹{trip.budget}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        trip.budgetExceeded ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((trip.totalExpense / trip.budget) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>📅 {new Date(trip.startDate).toLocaleDateString()} → {new Date(trip.endDate).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/trip/${trip._id}`}
                    className="flex-1 text-center bg-blue-50 text-blue-600 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => deleteTrip(trip._id)}
                    className="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 transition"
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