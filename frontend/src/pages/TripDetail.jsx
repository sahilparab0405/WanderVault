import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import NearbyPlaces from '../components/NearbyPlaces';
import BudgetTracker from '../components/BudgetTracker';
import { TripDetailSkeleton } from '../components/Skeleton';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  AlertTriangle, CheckCircle, MapPin, Calendar, Trash2,
  Plane, Train, Bus, Car, Utensils, Building2, Compass, ShoppingBag, MoreHorizontal, DollarSign, Map,
} from 'lucide-react';

const TripMap = lazy(() => import('../components/TripMap'));

const CATEGORIES = ['Food', 'Transport', 'Hotel', 'Activities', 'Shopping', 'Other'];

const CATEGORY_ICON_MAP = {
  Food:       Utensils,
  Transport:  Car,
  Hotel:      Building2,
  Activities: Compass,
  Shopping:   ShoppingBag,
  Other:      MoreHorizontal,
};

const TRAVEL_MODE_MAP = {
  flight: { Icon: Plane,  label: 'Flight' },
  train:  { Icon: Train,  label: 'Train' },
  bus:    { Icon: Bus,    label: 'Bus' },
  car:    { Icon: Car,    label: 'Car' },
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

  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', date: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [tripRes, expenseRes] = await Promise.all([API.get(`/trips/${id}`), API.get(`/expenses/${id}`)]);
      setTrip(tripRes.data);
      setExpenses(expenseRes.data);
      if (tripRes.data.budgetExceeded) setBudgetAlert(true);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title || !form.title.trim() || form.title.trim().length < 2) errs.title = 'Title must be at least 2 characters';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter a valid amount greater than 0';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    setFormLoading(true); setError('');
    try {
      const payload = { title: form.title.trim(), amount: Number(form.amount), category: form.category || 'Food', date: form.date || new Date().toISOString().split('T')[0] };
      const { data } = await API.post(`/expenses/${id}`, payload);
      setExpenses(prev => [...prev, data.expense]);
      setTrip(prev => ({ ...prev, totalExpense: data.totalExpense, budgetExceeded: data.budgetExceeded }));
      if (data.budgetExceeded) setBudgetAlert(true);
      setForm({ title: '', amount: '', category: 'Food', date: '' }); setFormErrors({}); setShowForm(false);
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to add expense'); }
    finally { setFormLoading(false); }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await API.delete(`/expenses/${expenseId}`);
      setExpenses(expenses.filter(e => e._id !== expenseId));
      const { data } = await API.get(`/trips/${id}`);
      setTrip(data);
      if (!data.budgetExceeded) setBudgetAlert(false);
    } catch (err) { console.error(err); }
  };

  const budgetPercent = trip ? Math.min((trip.totalExpense / trip.budget) * 100, 100) : 0;
  const tripDuration = trip ? Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const travelMode = trip ? (TRAVEL_MODE_MAP[trip.travelMode] || TRAVEL_MODE_MAP.flight) : null;

  if (loading) return <TripDetailSkeleton />;

  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center bg-bg page-content">
      <p className="text-danger font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Trip not found.</p>
    </div>
  );

  const hasCoordinates = trip.latitude && trip.longitude;

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        <Link to="/dashboard" className="inline-flex items-center gap-1 text-text-secondary hover:text-navy text-sm no-underline transition-colors duration-150 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>← Back to Dashboard</Link>

        {/* Budget Alert Banner */}
        {budgetAlert && (
          <div className="bg-danger-light border border-danger/30 text-danger px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <AlertTriangle size={20} strokeWidth={1.5} />
            <div>
              <p className="font-bold text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Budget Exceeded</p>
              <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>You've gone over your budget for {trip.name}.</p>
            </div>
            <button onClick={() => setBudgetAlert(false)} className="ml-auto text-danger/60 hover:text-danger text-xl cursor-pointer bg-transparent border-0">×</button>
          </div>
        )}

        {/* Section Toggle (Mobile) */}
        {hasCoordinates && (
          <div className="flex gap-2 mb-6 md:hidden">
            <button onClick={() => setActiveSection('overview')} className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all duration-150 ${activeSection === 'overview' ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
              Overview
            </button>
            <button onClick={() => setActiveSection('explore')} className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all duration-150 ${activeSection === 'explore' ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="flex items-center justify-center gap-1"><Map size={12} strokeWidth={1.5} />Explore</span>
            </button>
          </div>
        )}

        <div className={`grid gap-6 ${hasCoordinates ? 'md:grid-cols-5' : ''}`}>

          {/* LEFT: Trip Overview + Expenses */}
          <div className={`space-y-6 ${hasCoordinates ? 'md:col-span-3' : ''} ${hasCoordinates && activeSection !== 'overview' ? 'hidden md:block' : ''}`}>

            {/* Trip Header */}
            <div className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>{trip.name}</h1>
                  <p className="text-text-secondary text-sm flex items-center gap-1 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <MapPin size={14} strokeWidth={1.5} className="text-accent shrink-0" />{trip.destination}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {travelMode && (() => { const TIcon = travelMode.Icon; return (
                      <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <TIcon size={12} strokeWidth={1.5} />{travelMode.label}
                      </span>
                    ); })()}
                    <span className="text-xs bg-bg text-text-secondary px-2 py-0.5 rounded-full border border-border-light font-medium flex items-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <Calendar size={12} strokeWidth={1.5} />
                      {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-xs bg-bg text-text-secondary px-2 py-0.5 rounded-full border border-border-light font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {tripDuration} {tripDuration === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${trip.budgetExceeded ? 'bg-danger-light text-danger' : 'bg-success-light text-success'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                  {trip.budgetExceeded ? <AlertTriangle size={12} strokeWidth={1.5} /> : <CheckCircle size={12} strokeWidth={1.5} />}
                  {trip.budgetExceeded ? 'Over Budget' : 'On Budget'}
                </span>
              </div>

              {/* Budget Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="text-text-secondary font-medium">Spent: <span className="text-navy font-bold">₹{trip.totalExpense?.toLocaleString()}</span></span>
                  <span className="text-text-secondary font-medium">Budget: <span className="text-navy font-bold">₹{trip.budget?.toLocaleString()}</span></span>
                </div>
                <div className="w-full bg-border-light rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all duration-500 ${trip.budgetExceeded ? 'bg-danger' : budgetPercent > 75 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${budgetPercent}%` }} />
                </div>
                <p className="text-xs text-text-muted mt-1 text-right" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {budgetPercent.toFixed(1)}% used • ₹{Math.max(trip.budget - trip.totalExpense, 0).toLocaleString()} remaining
                </p>
              </div>

              {/* Quick Actions */}
              <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-2">
                <Link to={`/trip/${id}/itinerary`} id="trip-itinerary-link" className="inline-flex items-center gap-1.5 bg-primary-50 text-primary px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-colors duration-150 no-underline" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <Calendar size={14} strokeWidth={1.5} />Itinerary
                </Link>
                <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1.5 bg-accent-50 text-accent px-4 py-2 rounded-lg text-xs font-semibold hover:bg-accent-100 transition-colors duration-150 cursor-pointer border-0" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {showForm ? '✕ Cancel' : <><DollarSign size={14} strokeWidth={1.5} />Add Expense</>}
                </button>
              </div>
            </div>

            {/* Budget Analytics */}
            <BudgetTracker trip={trip} expenses={expenses} />

            {/* Expenses Section */}
            <div className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Expenses ({expenses.length})</h3>
                <button onClick={() => setShowForm(!showForm)} id="trip-add-expense-toggle" className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer border-0" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {showForm ? '✕ Cancel' : '+ Add'}
                </button>
              </div>

              {/* Add Expense Form */}
              {showForm && (
                <div className="bg-primary-50 rounded-xl p-5 mb-5 border border-primary-100">
                  <h4 className="font-semibold text-navy mb-4 text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>New Expense</h4>
                  {error && <div className="bg-danger-light text-danger p-2 rounded-lg mb-3 text-sm font-medium border border-danger/20" style={{ fontFamily: "'Inter', sans-serif" }}>{error}</div>}
                  <form onSubmit={handleAddExpense} className="space-y-3" noValidate>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Title</label>
                        <input type="text" placeholder="Hotel booking" id="expense-title" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white text-navy ${formErrors.title ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`} style={{ fontFamily: "'Inter', sans-serif" }} value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); if (formErrors.title) setFormErrors(p => ({ ...p, title: '' })); }} />
                        {formErrors.title && <p className="text-xs text-danger mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{formErrors.title}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Amount (₹)</label>
                        <input type="number" placeholder="500" id="expense-amount" min="1" step="any" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white text-navy ${formErrors.amount ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`} style={{ fontFamily: "'Inter', sans-serif" }} value={form.amount} onChange={(e) => { setForm({ ...form, amount: e.target.value }); if (formErrors.amount) setFormErrors(p => ({ ...p, amount: '' })); }} />
                        {formErrors.amount && <p className="text-xs text-danger mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{formErrors.amount}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Category</label>
                        <select id="expense-category" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy" style={{ fontFamily: "'Inter', sans-serif" }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Date</label>
                        <DatePicker selected={form.date ? new Date(form.date + 'T12:00:00') : null} onChange={(date) => { if (date) { const s = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; setForm({ ...form, date: s }); } else setForm({ ...form, date: '' }); }} dateFormat="yyyy-MM-dd" placeholderText="Select date" id="expense-date" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy" wrapperClassName="w-full" />
                      </div>
                    </div>
                    <button type="submit" disabled={formLoading || !form.title || !form.title.trim() || !form.amount || Number(form.amount) <= 0} id="expense-submit" className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer border-0 flex items-center justify-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {formLoading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Adding...</> : 'Add Expense'}
                    </button>
                  </form>
                </div>
              )}

              {/* Expense List */}
              {expenses.length === 0 ? (
                <div className="text-center py-10">
                  <div className="flex justify-center mb-3"><DollarSign size={36} strokeWidth={1.5} className="text-text-muted opacity-60" /></div>
                  <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>No expenses added yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map(exp => {
                    const CatIcon = CATEGORY_ICON_MAP[exp.category] || MoreHorizontal;
                    return (
                      <div key={exp._id} className="flex items-center justify-between p-3 bg-bg rounded-xl hover:bg-border-light transition-colors duration-150 border border-transparent hover:border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white border border-border-light flex items-center justify-center shrink-0">
                            <CatIcon size={18} strokeWidth={1.5} style={{ color: '#6B7280' }} />
                          </div>
                          <div>
                            <p className="font-medium text-navy text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{exp.title}</p>
                            <p className="text-xs text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>{exp.category} • {new Date(exp.date || exp.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>₹{exp.amount?.toLocaleString()}</span>
                          <button onClick={() => handleDeleteExpense(exp._id)} className="text-danger/60 hover:text-danger transition-colors duration-150 cursor-pointer bg-transparent border-0 p-1">
                            <Trash2 size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Map + Nearby Places */}
          {hasCoordinates && (
            <div className={`md:col-span-2 space-y-6 ${activeSection !== 'explore' ? 'hidden md:block' : ''}`}>
              <Suspense fallback={
                <div className="bg-card rounded-xl border border-border p-8 text-center" style={{ boxShadow: 'var(--shadow-card)', height: '350px' }}>
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--color-border)', borderTopColor: 'var(--color-primary)' }} />
                    <p className="text-text-muted text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Loading map...</p>
                  </div>
                </div>
              }>
                <TripMap latitude={trip.latitude} longitude={trip.longitude} destination={trip.destination} nearbyPlaces={nearbyPlaces} />
              </Suspense>
              <NearbyPlaces tripId={trip._id} latitude={trip.latitude} longitude={trip.longitude} onPlacesLoaded={setNearbyPlaces} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
