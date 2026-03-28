import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

const CATEGORIES = ['Food', 'Transport', 'Hotel', 'Activities', 'Shopping', 'Other'];

const CATEGORY_ICONS = {
  Food: '🍔', Transport: '🚗', Hotel: '🏨',
  Activities: '🎯', Shopping: '🛍️', Other: '💸'
};

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [budgetAlert, setBudgetAlert] = useState(false);

  const [form, setForm] = useState({
    title: '', amount: '', category: 'Food', date: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

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

        {/* Trip Header */}
        <div className="bg-card rounded-xl p-6 mb-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>{trip.name}</h2>
              <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>📍 {trip.destination}</p>
              <p className="text-text-muted text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                📅 {new Date(trip.startDate).toLocaleDateString()} →{' '}
                {new Date(trip.endDate).toLocaleDateString()}
              </p>
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
                Spent: <span className="text-navy font-bold">₹{trip.totalExpense}</span>
              </span>
              <span className="text-text-secondary font-medium">
                Budget: <span className="text-navy font-bold">₹{trip.budget}</span>
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
              {budgetPercent.toFixed(1)}% used •{' '}
              ₹{Math.max(trip.budget - trip.totalExpense, 0)} remaining
            </p>
          </div>

          {/* Itinerary Button */}
          <div className="mt-5 pt-4 border-t border-border">
            <Link
              to={`/trip/${id}/itinerary`}
              id="trip-itinerary-link"
              className="inline-flex items-center gap-2 bg-primary-50 text-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors duration-150 no-underline"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              📅 View / Edit Itinerary
            </Link>
          </div>
        </div>

        {/* Category Summary */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="bg-card rounded-xl p-6 mb-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h3 className="font-bold text-navy mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Spending by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(categoryTotals).map(([cat, total]) => (
                <div key={cat} className="bg-bg rounded-xl p-3 flex items-center gap-3 border border-border-light">
                  <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
                  <div>
                    <p className="text-xs text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>{cat}</p>
                    <p className="font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>₹{total}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses Section */}
        <div className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-navy text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Expenses ({expenses.length})
            </h3>
            <button
              onClick={() => setShowForm(!showForm)}
              id="trip-add-expense-toggle"
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer border-0"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {showForm ? '✕ Cancel' : '+ Add Expense'}
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
            <div className="space-y-3">
              {expenses.map(exp => (
                <div
                  key={exp._id}
                  className="flex items-center justify-between p-4 bg-bg rounded-xl hover:bg-border-light transition-colors duration-150 border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_ICONS[exp.category]}</span>
                    <div>
                      <p className="font-medium text-navy text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{exp.title}</p>
                      <p className="text-xs text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {exp.category} • {new Date(exp.date || exp.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>₹{exp.amount}</span>
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
    </div>
  );
}
