import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import NearbyPlaces from '../components/NearbyPlaces';
import BudgetTracker from '../components/BudgetTracker';

/* Lazy-load the map component (Leaflet is heavy — only load when needed) */
const TripMap = lazy(() => import('../components/TripMap'));

const CATEGORIES = ['Food', 'Transport', 'Hotel', 'Activities', 'Shopping', 'Other'];

const CATEGORY_ICONS = {
  Food: '🍔', Transport: '🚗', Hotel: '🏨',
  Activities: '🎯', Shopping: '🛍️', Other: '💸'
};

const TRAVEL_MODES = {
  flight: { icon: '✈️', label: 'Flight' },
  train: { icon: '🚂', label: 'Train' },
  bus: { icon: '🚌', label: 'Bus' },
  car: { icon: '🚗', label: 'Car' },
};

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [budgetAlert, setBudgetAlert] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

  const [form, setForm] = useState({
    title: '', amount: '', category: 'Food', date: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  /* ─── Active tab for mobile: overview / explore ─── */
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [tripRes, expenseRes] = await Promise.all([
        API.get(`/trips/${id}`),
        API.get(`/expenses/${id}`)
      ]);
      setTrip(tripRes.data);
      setExpenses(expenseRes.data);
      if (tripRes.data.budgetExceeded) setBudgetAlert(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const { data } = await API.post(`/expenses/${id}`, form);
      setExpenses([...expenses, data.expense]);
      setTrip(prev => ({
        ...prev,
        totalExpense: data.totalExpense,
        budgetExceeded: data.budgetExceeded
      }));
      if (data.budgetExceeded) setBudgetAlert(true);
      setForm({ title: '', amount: '', category: 'Food', date: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    }
    setFormLoading(false);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await API.delete(`/expenses/${expenseId}`);
      setExpenses(expenses.filter(e => e._id !== expenseId));
      const { data } = await API.get(`/trips/${id}`);
      setTrip(data);
      if (!data.budgetExceeded) setBudgetAlert(false);
    } catch (err) {
      console.error(err);
    }
  };

  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const budgetPercent = trip
    ? Math.min((trip.totalExpense / trip.budget) * 100, 100)
    : 0;

  // Trip duration
  const tripDuration = trip
    ? Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const travelMode = trip ? (TRAVEL_MODES[trip.travelMode] || TRAVEL_MODES.flight) : null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg page-content">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
          Loading trip details...
        </p>
      </div>
    </div>
  );

  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center bg-bg page-content">
      <p className="text-danger font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Trip not found!</p>
    </div>
  );

  const hasCoordinates = trip.latitude && trip.longitude;

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-text-secondary hover:text-navy text-sm no-underline transition-colors duration-150 mb-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          ← Back to Dashboard
        </Link>

        {/* Budget Alert Banner */}
        {budgetAlert && (
          <div className="bg-danger-light border border-danger/30 text-danger px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Budget Exceeded!</p>
              <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>You've gone over your budget for {trip.name}.</p>
            </div>
            <button
              onClick={() => setBudgetAlert(false)}
              className="ml-auto text-danger/60 hover:text-danger text-xl cursor-pointer bg-transparent border-0"
            >×</button>
          </div>
        )}

        {/* ═══ Section Toggle (Mobile-friendly) ═══ */}
        {hasCoordinates && (
          <div className="flex gap-2 mb-6 md:hidden">
            <button
              onClick={() => setActiveSection('overview')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all duration-150 ${
                activeSection === 'overview'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border'
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              📋 Overview
            </button>
            <button
              onClick={() => setActiveSection('explore')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all duration-150 ${
                activeSection === 'explore'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border'
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              🗺️ Explore
            </button>
          </div>
        )}

        {/* ═══ TWO-COLUMN LAYOUT ═══ */}
        <div className={`grid gap-6 ${hasCoordinates ? 'md:grid-cols-5' : ''}`}>

          {/* ─── LEFT: Trip Overview + Expenses (3 cols) ─── */}
          <div className={`space-y-6 ${hasCoordinates ? 'md:col-span-3' : ''} ${
            hasCoordinates && activeSection !== 'overview' ? 'hidden md:block' : ''
          }`}>

            {/* Trip Header */}
            <div className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>{trip.name}</h1>
                  <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>📍 {trip.destination}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {travelMode && (
                      <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full font-semibold"
                        style={{ fontFamily: "'Inter', sans-serif" }}>
                        {travelMode.icon} {travelMode.label}
                      </span>
                    )}
                    <span className="text-xs bg-bg text-text-secondary px-2 py-0.5 rounded-full border border-border-light font-medium"
                      style={{ fontFamily: "'Inter', sans-serif" }}>
                      📅 {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-xs bg-bg text-text-secondary px-2 py-0.5 rounded-full border border-border-light font-medium"
                      style={{ fontFamily: "'Inter', sans-serif" }}>
                      {tripDuration} {tripDuration === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  trip.budgetExceeded
                    ? 'bg-danger-light text-danger'
                    : 'bg-success-light text-success'
                }`} style={{ fontFamily: "'Inter', sans-serif" }}>
                  {trip.budgetExceeded ? '⚠️ Over Budget' : '✅ On Budget'}
                </span>
              </div>

              {/* Budget Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="text-text-secondary font-medium">
                    Spent: <span className="text-navy font-bold">₹{trip.totalExpense?.toLocaleString()}</span>
                  </span>
                  <span className="text-text-secondary font-medium">
                    Budget: <span className="text-navy font-bold">₹{trip.budget?.toLocaleString()}</span>
                  </span>
                </div>
                <div className="w-full bg-border-light rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      trip.budgetExceeded ? 'bg-danger' :
                      budgetPercent > 75 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1 text-right" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {budgetPercent.toFixed(1)}% used • ₹{Math.max(trip.budget - trip.totalExpense, 0).toLocaleString()} remaining
                </p>
              </div>

              {/* Quick Actions */}
              <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-2">
                <Link
                  to={`/trip/${id}/itinerary`}
                  id="trip-itinerary-link"
                  className="inline-flex items-center gap-1.5 bg-primary-50 text-primary px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-colors duration-150 no-underline"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  📅 Itinerary
                </Link>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="inline-flex items-center gap-1.5 bg-accent-50 text-accent px-4 py-2 rounded-lg text-xs font-semibold hover:bg-accent-100 transition-colors duration-150 cursor-pointer border-0"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {showForm ? '✕ Cancel' : '💰 Add Expense'}
                </button>
              </div>
            </div>

            {/* Budget Analytics */}
            <BudgetTracker trip={trip} expenses={expenses} />

            {/* Expenses Section */}
            <div className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Expenses ({expenses.length})
                </h3>
                <button
                  onClick={() => setShowForm(!showForm)}
                  id="trip-add-expense-toggle"
                  className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer border-0"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {showForm ? '✕ Cancel' : '+ Add'}
                </button>
              </div>

              {/* Add Expense Form */}
              {showForm && (
                <div className="bg-primary-50 rounded-xl p-5 mb-5 border border-primary-100">
                  <h4 className="font-semibold text-navy mb-4 text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>New Expense</h4>
                  {error && (
                    <div className="bg-danger-light text-danger p-2 rounded-lg mb-3 text-sm font-medium border border-danger/20"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >{error}</div>
                  )}
                  <form onSubmit={handleAddExpense} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Title</label>
                        <input
                          type="text" required placeholder="Hotel booking"
                          id="expense-title"
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Amount (₹)</label>
                        <input
                          type="number" required placeholder="500"
                          id="expense-amount"
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Category</label>
                        <select
                          id="expense-category"
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Date</label>
                        <input
                          type="date"
                          id="expense-date"
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      type="submit" disabled={formLoading}
                      id="expense-submit"
                      className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white py-2 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer border-0"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {formLoading ? 'Adding...' : 'Add Expense ✓'}
                    </button>
                  </form>
                </div>
              )}

              {/* Expense List */}
              {expenses.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-3">💸</p>
                  <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>No expenses yet. Add your first one!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map(exp => (
                    <div
                      key={exp._id}
                      className="flex items-center justify-between p-3 bg-bg rounded-xl hover:bg-border-light transition-colors duration-150 border border-transparent hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{CATEGORY_ICONS[exp.category]}</span>
                        <div>
                          <p className="font-medium text-navy text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{exp.title}</p>
                          <p className="text-xs text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {exp.category} • {new Date(exp.date || exp.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>₹{exp.amount?.toLocaleString()}</span>
                        <button
                          onClick={() => handleDeleteExpense(exp._id)}
                          className="text-danger/60 hover:text-danger transition-colors duration-150 text-sm cursor-pointer bg-transparent border-0"
                        >🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Map + Nearby Places (2 cols) ─── */}
          {hasCoordinates && (
            <div className={`md:col-span-2 space-y-6 ${
              activeSection !== 'explore' ? 'hidden md:block' : ''
            }`}>
              {/* Map */}
              <Suspense fallback={
                <div className="bg-card rounded-xl border border-border p-8 text-center animate-pulse"
                  style={{ boxShadow: 'var(--shadow-card)', height: '350px' }}>
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <span className="text-4xl">🗺️</span>
                    <p className="text-text-muted text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Loading map...</p>
                  </div>
                </div>
              }>
                <TripMap
                  latitude={trip.latitude}
                  longitude={trip.longitude}
                  destination={trip.destination}
                  nearbyPlaces={nearbyPlaces}
                />
              </Suspense>

              {/* Nearby Places */}
              <NearbyPlaces
                latitude={trip.latitude}
                longitude={trip.longitude}
                onPlacesLoaded={setNearbyPlaces}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
