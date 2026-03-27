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
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-lg">Loading trip details...</p>
    </div>
  );

  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-400">Trip not found!</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">🌍 WanderVault</h1>
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Budget Alert Banner */}
        {budgetAlert && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold">Budget Exceeded!</p>
              <p className="text-sm">You've gone over your budget for {trip.name}.</p>
            </div>
            <button
              onClick={() => setBudgetAlert(false)}
              className="ml-auto text-red-400 hover:text-red-600 text-xl"
            >×</button>
          </div>
        )}

        {/* Trip Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{trip.name}</h2>
              <p className="text-gray-500">📍 {trip.destination}</p>
              <p className="text-gray-400 text-sm mt-1">
                📅 {new Date(trip.startDate).toLocaleDateString()} →{' '}
                {new Date(trip.endDate).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              trip.budgetExceeded
                ? 'bg-red-100 text-red-600'
                : 'bg-green-100 text-green-600'
            }`}>
              {trip.budgetExceeded ? '⚠️ Over Budget' : '✅ On Budget'}
            </span>
          </div>

          {/* Budget Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">
                Spent: <span className="text-gray-800 font-bold">₹{trip.totalExpense}</span>
              </span>
              <span className="text-gray-600 font-medium">
                Budget: <span className="text-gray-800 font-bold">₹{trip.budget}</span>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  trip.budgetExceeded ? 'bg-red-500' :
                  budgetPercent > 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">
              {budgetPercent.toFixed(1)}% used •{' '}
              ₹{Math.max(trip.budget - trip.totalExpense, 0)} remaining
            </p>
          </div>

          {/* ✅ ITINERARY BUTTON — Added here */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <Link
              to={`/trip/${id}/itinerary`}
              className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition"
            >
              📅 View / Edit Itinerary
            </Link>
          </div>
        </div>

        {/* Category Summary */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h3 className="font-bold text-gray-700 mb-4">Spending by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(categoryTotals).map(([cat, total]) => (
                <div key={cat} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
                  <div>
                    <p className="text-xs text-gray-500">{cat}</p>
                    <p className="font-bold text-gray-800">₹{total}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-gray-700 text-lg">
              Expenses ({expenses.length})
            </h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {showForm ? '✕ Cancel' : '+ Add Expense'}
            </button>
          </div>

          {/* Add Expense Form */}
          {showForm && (
            <div className="bg-blue-50 rounded-xl p-5 mb-5 border border-blue-100">
              <h4 className="font-semibold text-blue-800 mb-4">New Expense</h4>
              {error && (
                <div className="bg-red-100 text-red-600 p-2 rounded-lg mb-3 text-sm">{error}</div>
              )}
              <form onSubmit={handleAddExpense} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                    <input
                      type="text" required placeholder="Hotel booking"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                    <input
                      type="number" required placeholder="500"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  type="submit" disabled={formLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition"
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
              <p className="text-gray-400">No expenses yet. Add your first one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map(exp => (
                <div
                  key={exp._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_ICONS[exp.category]}</span>
                    <div>
                      <p className="font-medium text-gray-800">{exp.title}</p>
                      <p className="text-xs text-gray-400">
                        {exp.category} • {new Date(exp.date || exp.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800">₹{exp.amount}</span>
                    <button
                      onClick={() => handleDeleteExpense(exp._id)}
                      className="text-red-400 hover:text-red-600 transition text-sm"
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
