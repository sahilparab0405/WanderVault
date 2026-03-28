import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

export default function CreateTrip() {
  const [form, setForm] = useState({
    name: '', destination: '', startDate: '', endDate: '', budget: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/trips', form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-6 mt-4">
          <Link
            to="/dashboard"
            className="text-text-secondary hover:text-navy transition-colors duration-150 no-underline text-sm"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            ← Back
          </Link>
          <h2
            className="text-2xl font-bold text-navy"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Create New Trip ✈️
          </h2>
        </div>

        <div
          className="bg-card rounded-xl p-6 border border-border"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {error && (
            <div
              className="bg-danger-light text-danger p-3 rounded-lg mb-4 text-sm font-medium border border-danger/20"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium text-navy mb-1"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Trip Name
              </label>
              <input
                type="text" required placeholder="Goa Summer Trip"
                id="create-trip-name"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                style={{ fontFamily: "'Inter', sans-serif" }}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-navy mb-1"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Destination
              </label>
              <input
                type="text" required placeholder="Goa, India"
                id="create-trip-destination"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                style={{ fontFamily: "'Inter', sans-serif" }}
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium text-navy mb-1"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Start Date
                </label>
                <input
                  type="date" required
                  id="create-trip-start"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-navy mb-1"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  End Date
                </label>
                <input
                  type="date" required
                  id="create-trip-end"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-medium text-navy mb-1"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Total Budget (₹)
              </label>
              <input
                type="number" required placeholder="10000"
                id="create-trip-budget"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                style={{ fontFamily: "'Inter', sans-serif" }}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>
            <button
              type="submit" disabled={loading}
              id="create-trip-submit"
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors duration-150 cursor-pointer border-0 text-sm"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {loading ? 'Creating...' : 'Create Trip 🚀'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}