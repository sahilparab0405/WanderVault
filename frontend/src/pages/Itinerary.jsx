import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';

export default function Itinerary() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [trip, setTrip] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    day: '', title: '', description: '', location: '', time: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [tripRes, itemsRes] = await Promise.all([
        API.get(`/trips/${id}`),
        API.get(`/itinerary/${id}`)
      ]);
      setTrip(tripRes.data);
      setItems(itemsRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/itinerary/${id}`, form);
      setItems([...items, data].sort((a, b) => a.day - b.day));
      setForm({ day: '', title: '', description: '', location: '', time: '' });
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await API.delete(`/itinerary/${itemId}`);
      setItems(items.filter(i => i._id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  // Group by day
  const groupedByDay = items.reduce((acc, item) => {
    const day = `Day ${item.day}`;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading itinerary...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">🌍 WanderVault</h1>
        <Link to={`/trip/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Trip
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📅 Itinerary</h2>
            {trip && <p className="text-gray-500 text-sm">{trip.name} • {trip.destination}</p>}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {showForm ? '✕ Cancel' : '+ Add Item'}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-blue-100">
            <h4 className="font-semibold text-gray-700 mb-4">New Itinerary Item</h4>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Day Number</label>
                  <input
                    type="number" required placeholder="1"
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Activity Title</label>
                <input
                  type="text" required placeholder="Visit Baga Beach"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input
                  type="text" placeholder="Baga Beach, Goa"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  placeholder="Carry sunscreen, rent a scooter..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition"
              >
                Add to Itinerary ✓
              </button>
            </form>
          </div>
        )}

        {/* Itinerary Timeline */}
        {Object.keys(groupedByDay).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-gray-400">No itinerary yet. Plan your days!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDay).map(([day, dayItems]) => (
              <div key={day}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {day}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-3 ml-2">
                  {dayItems.map(item => (
                    <div key={item._id}
                      className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-start hover:shadow-md transition"
                    >
                      <div className="flex gap-3">
                        <div className="w-1 bg-blue-400 rounded-full min-h-full" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800">{item.title}</p>
                            {item.time && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                🕐 {item.time}
                              </span>
                            )}
                          </div>
                          {item.location && (
                            <p className="text-sm text-gray-500 mt-0.5">📍 {item.location}</p>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-400 hover:text-red-600 text-sm ml-3 shrink-0"
                      >🗑️</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}