import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { ItinerarySkeleton } from '../components/Skeleton';

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

  /* FIX 6: Full skeleton instead of spinner */
  if (loading) return <ItinerarySkeleton />;

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Back link */}
        <Link
          to={`/trip/${id}`}
          className="inline-flex items-center gap-1 text-text-secondary hover:text-navy text-sm no-underline transition-colors duration-150 mb-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          ← Back to Trip
        </Link>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>📅 Itinerary</h2>
            {trip && (
              <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                {trip.name} • {trip.destination}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            id="itinerary-add-toggle"
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer border-0"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {showForm ? '✕ Cancel' : '+ Add Item'}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-card rounded-xl p-6 mb-6 border border-primary-100" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h4 className="font-semibold text-navy mb-4 text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>New Itinerary Item</h4>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Day Number</label>
                  <input
                    type="number" required placeholder="1"
                    min="1"
                    id="itinerary-day"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Time</label>
                  <input
                    type="time"
                    id="itinerary-time"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Activity Title</label>
                <input
                  type="text" required placeholder="Visit Baga Beach"
                  id="itinerary-title"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Location</label>
                <input
                  type="text" placeholder="Baga Beach, Goa"
                  id="itinerary-location"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Notes</label>
                <textarea
                  placeholder="Carry sunscreen, rent a scooter..."
                  rows={2}
                  id="itinerary-description"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy resize-y"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <button
                type="submit"
                id="itinerary-submit"
                className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer border-0"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Add to Itinerary ✓
              </button>
            </form>
          </div>
        )}

        {/* Itinerary Timeline */}
        {Object.keys(groupedByDay).length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>No itinerary yet. Plan your days!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDay).map(([day, dayItems]) => (
              <div key={day}>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {day}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-3 ml-2">
                  {dayItems.map(item => (
                    <div key={item._id}
                      className="bg-card rounded-xl p-4 flex justify-between items-start border border-border hover:border-primary-100 transition-all duration-150"
                      style={{ boxShadow: 'var(--shadow-sm)' }}
                    >
                      <div className="flex gap-3">
                        <div className="w-1 bg-primary rounded-full min-h-full" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-navy text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{item.title}</p>
                            {item.time && (
                              <span className="text-xs bg-bg text-text-secondary px-2 py-0.5 rounded-full border border-border-light"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                              >
                                🕐 {item.time}
                              </span>
                            )}
                          </div>
                          {item.location && (
                            <p className="text-sm text-text-secondary mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>📍 {item.location}</p>
                          )}
                          {item.description && (
                            <p className="text-sm text-text-muted mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>{item.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-danger/60 hover:text-danger text-sm ml-3 shrink-0 cursor-pointer bg-transparent border-0"
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