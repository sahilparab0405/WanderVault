import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import NearbyPlaces from '../components/NearbyPlaces';
import BudgetTracker from '../components/BudgetTracker';
import { TripDetailSkeleton } from '../components/Skeleton';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  AlertTriangle, CheckCircle, MapPin, Calendar, Trash2,
  Plane, Train, Bus, Car, Utensils, Building2, Compass, ShoppingBag, MoreHorizontal, DollarSign, Map, Edit, ExternalLink, Plus, Wifi, Bath, Flame, ParkingCircle, Star
} from 'lucide-react';

const TripMap = lazy(() => import('../components/TripMap'));
const DiningNearby = lazy(() => import('../components/DiningNearby'));
const SightseeingNearby = lazy(() => import('../components/SightseeingNearby'));

const CATEGORIES = ['Food', 'Transport', 'Hotel', 'Activities', 'Shopping', 'Other'];

const CATEGORY_ICON_MAP = {
  Food: Utensils, Transport: Car, Hotel: Building2,
  Activities: Compass, Shopping: ShoppingBag, Other: MoreHorizontal,
};

const TRAVEL_MODE_MAP = {
  flight: { Icon: Plane, label: 'Flight' },
  train:  { Icon: Train, label: 'Train' },
  bus:    { Icon: Bus,   label: 'Bus' },
  car:    { Icon: Car,   label: 'Car' },
};

/* ─── Cache & Hotel Search Utils ─── */
const CACHE_TTL = 1000 * 60 * 60 * 24;
const HOTEL_CACHE_HOUR = 60 * 60 * 1000;

function getCachedData(key) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  const parsed = JSON.parse(cached);
  if (Date.now() - parsed.ts > CACHE_TTL) return null;
  return parsed.data;
}
function setCachedData(key, data) {
  localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
}
function writeHotelFallbackCache(key) {
  // Write empty cache ~23h ago so it expires in ~1h and prevents re-requests
  localStorage.setItem(key, JSON.stringify({
    ts: Date.now() - (23 * HOTEL_CACHE_HOUR),
    data: []
  }));
}

/* ─── useHotelSearch — only fires when enabled=true ─── */
function useHotelSearch(destination, enabled) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!destination || !enabled) return;

    let cancelled = false;
    const fetchHotels = async () => {
      setLoading(true);
      const cacheKey = 'wv_hotels_' + destination.toLowerCase();
      const cached = getCachedData(cacheKey);
      if (cached) { setHotels(cached); setLoading(false); return; }

      // 2-second delay to avoid Nominatim rate limiting on page load
      await new Promise(r => setTimeout(r, 2000));
      if (cancelled) return;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=hotel+in+${encodeURIComponent(destination)}&limit=6`,
          { headers: { 'Accept-Language': 'en' } }
        );

        if (res.status === 429) {
          writeHotelFallbackCache(cacheKey);
          setHotels([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        const results = data.map(item => {
          const hash = String(item.place_id).split('').reduce((a,c) => a + c.charCodeAt(0), 0)
                     + (item.name || '').split('').reduce((a,c) => a + c.charCodeAt(0), 0);
          const price = Math.round((800 + (hash % 4700)) / 50) * 50;
          return {
            id: item.place_id,
            name: item.name || 'Hotel',
            address: item.display_name.split(',').slice(0, 3).join(', '),
            distance: (0.5 + (hash % 40) / 10).toFixed(1) + 'km',
            price,
            rating: (3.0 + ((hash % 20) / 10)).toFixed(1),
            image: [
              'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=360&fit=crop&q=80',
              'https://images.unsplash.com/photo-1551882547-ff40c0d1398c?w=600&h=360&fit=crop&q=80',
              'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600&h=360&fit=crop&q=80',
              'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=600&h=360&fit=crop&q=80',
              'https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?w=600&h=360&fit=crop&q=80',
            ][hash % 5],
            amenities: [
              { Icon: Wifi, l: 'Wifi' }, { Icon: Bath, l: 'Tub' },
              { Icon: Flame, l: 'BBQ' }, { Icon: ParkingCircle, l: 'Parking' }
            ].slice(0, 3 + (hash % 2))
          };
        });
        setHotels(results);
        setCachedData(cacheKey, results);
      } catch {
        if (!cancelled) setHotels([]);
      }
      if (!cancelled) setLoading(false);
    };

    fetchHotels();
    return () => { cancelled = true; };
  }, [destination, enabled]);

  return { hotels, loading };
}

/* ─── Tab definitions ─── */
const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'hotels',      label: 'Accommodation' },
  { id: 'dining',      label: 'Dining' },
  { id: 'sightseeing', label: 'Sightseeing' },
  { id: 'explore',     label: 'Map' },
];

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip]       = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [budgetAlert, setBudgetAlert] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

  // Accommodation State
  const [accMode, setAccMode]   = useState(''); // 'browse' | 'booked' | ''
  const [accForm, setAccForm]   = useState({ name: '', checkIn: '', checkOut: '', pricePerNight: '', fromDay: '', toDay: '', bookedVia: '' });
  const [pendingHotelCost, setPendingHotelCost] = useState(null);

  const [form, setForm]             = useState({ title: '', amount: '', category: 'Food', date: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError]           = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Single tab bar — default 'overview', visible on ALL screen sizes
  const [activeSection, setActiveSection] = useState('overview');

  // Track which tabs have been visited (for lazy loading — only load on first click)
  const [visitedTabs, setVisitedTabs] = useState(new Set(['overview']));

  const handleTabClick = useCallback((tabId) => {
    setActiveSection(tabId);
    setVisitedTabs(prev => new Set([...prev, tabId]));
  }, []);

  // Hotels only fire once the Accommodation tab has been visited
  const hotelsEnabled = visitedTabs.has('hotels');
  const { hotels, loading: hotelsLoading } = useHotelSearch(trip?.destination, hotelsEnabled);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [tripRes, expenseRes] = await Promise.all([
        API.get(`/trips/${id}`),
        API.get(`/expenses/${id}`)
      ]);
      setTrip(tripRes.data);
      setExpenses(expenseRes.data);
      if (tripRes.data.budgetExceeded) setBudgetAlert(true);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAddExpense = async (payload) => {
    try {
      const { data } = await API.post(`/expenses/${id}`, payload);
      setExpenses(prev => [...prev, data.expense]);
      setTrip(prev => ({ ...prev, totalExpense: data.totalExpense, budgetExceeded: data.budgetExceeded }));
      if (data.budgetExceeded) setBudgetAlert(true);
      return data;
    } catch (err) { throw err; }
  };

  const submitExpenseForm = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title || !form.title.trim() || form.title.trim().length < 2) errs.title = 'Title must be at least 2 characters';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter a valid amount greater than 0';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({}); setFormLoading(true); setError('');
    try {
      await handleAddExpense({
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category || 'Food',
        date: form.date || new Date().toISOString().split('T')[0]
      });
      setForm({ title: '', amount: '', category: 'Food', date: '' });
      setShowForm(false);
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

  const handleSaveHotel = async () => {
    if (!accForm.name.trim()) return;
    try {
      const payload = { ...accForm, name: accForm.name.trim() };
      const { data } = await API.put(`/trips/${id}/accommodation`, payload);
      setTrip(data);
      setAccMode('');
      const days  = Number(accForm.toDay) - Number(accForm.fromDay);
      const price = Number(accForm.pricePerNight);
      if (days > 0 && price > 0) {
        setPendingHotelCost({ cost: days * price, accName: accForm.name });
      }
      setAccForm({ name: '', checkIn: '', checkOut: '', pricePerNight: '', fromDay: '', toDay: '', bookedVia: '' });
    } catch { alert('Failed to save hotel.'); }
  };

  const handleDeleteHotel = async (accId) => {
    if (!window.confirm('Remove this hotel?')) return;
    try {
      const { data } = await API.delete(`/trips/${id}/accommodation/${accId}`);
      setTrip(data);
    } catch { alert('Failed to remove hotel.'); }
  };

  const acceptHotelCost = async () => {
    if (!pendingHotelCost) return;
    try {
      await handleAddExpense({
        title: `Hotel: ${pendingHotelCost.accName}`,
        amount: pendingHotelCost.cost,
        category: 'Hotel',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) { console.error(err); }
    setPendingHotelCost(null);
  };

  const budgetPercent = trip ? Math.min((trip.totalExpense / trip.budget) * 100, 100) : 0;
  const tripDuration  = trip ? Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const travelMode    = trip ? (TRAVEL_MODE_MAP[trip.travelMode] || TRAVEL_MODE_MAP.flight) : null;
  const toDateStr     = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  if (loading) return <TripDetailSkeleton />;
  if (!trip)   return <div className="min-h-screen flex justify-center py-20 bg-bg"><p className="text-danger">Trip not found.</p></div>;

  const hasCoordinates = trip.latitude && trip.longitude;

  // Which tabs to show — hide map/dining/sightseeing if no coordinates
  const visibleTabs = TABS.filter(t => {
    if (['dining', 'sightseeing', 'explore'].includes(t.id) && !hasCoordinates) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-bg">
      {/* Hotel cost popup */}
      {pendingHotelCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl p-6 border border-border shadow-lg max-w-sm w-full">
            <h3 className="font-bold text-navy mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Add Hotel Expense?</h3>
            <p className="text-sm text-text-secondary mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              Add <strong className="text-navy">₹{pendingHotelCost.cost.toLocaleString()}</strong> hotel cost to your expenses for {pendingHotelCost.accName}?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPendingHotelCost(null)} className="flex-1 py-2 rounded-lg border border-border text-navy bg-white text-sm font-semibold hover:bg-border-light cursor-pointer">Skip</button>
              <button onClick={acceptHotelCost} className="flex-1 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-sm font-semibold cursor-pointer border-0">Yes, Add</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:pt-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-text-secondary hover:text-navy text-sm no-underline mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>← Back to Dashboard</Link>

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

        {/* ── Universal Tab Bar — visible on ALL screen sizes ── */}
        <div className="flex gap-0 mb-6 border-b border-border bg-white rounded-t-xl overflow-x-auto hide-scrollbar">
          {visibleTabs.map(({ id: tabId, label }) => (
            <button
              key={tabId}
              onClick={() => handleTabClick(tabId)}
              className={`
                px-4 py-3 text-sm font-semibold whitespace-nowrap border-0 bg-transparent cursor-pointer
                transition-all duration-150 relative
                ${activeSection === tabId
                  ? 'text-navy'
                  : 'text-text-secondary hover:text-navy'}
              `}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {label}
              {/* Navy underline for active tab */}
              {activeSection === tabId && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-navy rounded-t-sm" />
              )}
            </button>
          ))}
        </div>

        <div className="grid gap-6">
          <div className="space-y-6">

            {/* ── OVERVIEW TAB ── */}
            <div className={activeSection === 'overview' ? 'block space-y-6' : 'hidden'}>
              {/* Trip Header */}
              <div className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>{trip.name}</h1>
                    <p className="text-text-secondary text-sm flex items-center gap-1 mt-1"><MapPin size={14} className="text-accent" />{trip.destination}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {travelMode && (() => { const TIcon = travelMode.Icon; return <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><TIcon size={12}/> {travelMode.label}</span>; })()}
                      <span className="text-xs bg-bg text-text-secondary px-2 py-0.5 rounded-full border border-border-light font-medium">{tripDuration} Days</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${trip.budgetExceeded ? 'bg-danger-light text-danger' : 'bg-success-light text-success'}`}>
                    {trip.budgetExceeded ? <AlertTriangle size={12} strokeWidth={1.5} /> : <CheckCircle size={12} strokeWidth={1.5} />}
                    {trip.budgetExceeded ? 'Over Budget' : 'On Track'}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <span className="text-text-secondary font-medium">Spent: <span className="text-navy font-bold">₹{trip.totalExpense?.toLocaleString()}</span></span>
                    <span className="text-text-secondary font-medium">Budget: <span className="text-navy font-bold">₹{trip.budget?.toLocaleString()}</span></span>
                  </div>
                  <div className="w-full bg-border-light rounded-full h-3">
                    <div className={`h-3 rounded-full transition-all duration-500 ${trip.budgetExceeded ? 'bg-danger' : budgetPercent > 75 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${budgetPercent}%` }} />
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-2">
                  <Link to={`/trip/${id}/itinerary`} className="inline-flex items-center gap-1.5 bg-primary-50 text-primary px-4 py-2 rounded-lg text-xs font-semibold no-underline"><Calendar size={14} />Itinerary</Link>
                  <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1.5 bg-accent-50 text-accent px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer border-0">
                    {showForm ? '✕ Cancel' : <><DollarSign size={14} />Add Expense</>}
                  </button>
                  <button onClick={() => handleTabClick('hotels')} className="inline-flex items-center gap-1.5 bg-white border border-border text-navy px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"><Building2 size={14}/> Hotels</button>
                </div>
              </div>

              {/* Budget Analytics */}
              <BudgetTracker trip={trip} expenses={expenses} />

              {/* Expenses List */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex justify-between items-center mb-5"><h3 className="font-bold text-navy text-sm">Expenses ({expenses.length})</h3></div>
                {showForm && (
                  <div className="bg-primary-50 rounded-xl p-5 mb-5 border border-primary-100">
                    <form onSubmit={submitExpenseForm} className="space-y-3" noValidate>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-navy uppercase tracking-wider mb-1 px-1" style={{ fontFamily: "'Inter', sans-serif" }}>Expense Title</label>
                          <input type="text" placeholder="e.g. Dinner at Beach" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-navy uppercase tracking-wider mb-1 px-1" style={{ fontFamily: "'Inter', sans-serif" }}>Amount (₹)</label>
                          <input type="number" placeholder="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <DatePicker
                          selected={form.date ? new Date(form.date + 'T12:00:00') : null}
                          onChange={d => setForm({...form, date: d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : ''})}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                          wrapperClassName="w-full"
                        />
                      </div>
                      <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg text-sm font-semibold border-0">Add Expense</button>
                    </form>
                  </div>
                )}
                {expenses.length === 0 ? <p className="text-text-muted text-sm text-center py-5">No expenses.</p> : (
                  <div className="space-y-2">
                    {expenses.map(exp => {
                      const CatIcon = CATEGORY_ICON_MAP[exp.category] || MoreHorizontal;
                      return (
                        <div key={exp._id} className="flex justify-between p-3 bg-bg rounded-xl border border-transparent hover:border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white border border-border-light rounded-lg flex items-center justify-center"><CatIcon size={18} className="text-text-secondary"/></div>
                            <div><p className="font-medium text-navy text-sm">{exp.title}</p><p className="text-xs text-text-muted">{exp.category}</p></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-navy text-sm">₹{exp.amount}</span>
                            <button onClick={() => handleDeleteExpense(exp._id)} className="text-danger/60 hover:text-danger bg-transparent border-0 cursor-pointer"><Trash2 size={16}/></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── ACCOMMODATION TAB ── */}
            <div className={activeSection === 'hotels' ? 'block space-y-6' : 'hidden'}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Accommodation</h2>
                {!accMode && (
                  <button onClick={() => setAccMode('browse')} className="text-xs text-primary font-bold flex items-center gap-1 bg-transparent border-0 cursor-pointer">
                    <Plus size={14} /> Add Hotel
                  </button>
                )}
              </div>

              {!accMode && trip.accommodation?.length > 0 && (
                <div className="grid gap-3 mb-6">
                  {trip.accommodation.map((acc) => (
                    <div key={acc._id} className="bg-white rounded-xl p-4 border border-border hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-navy text-sm flex items-center gap-1"><Building2 size={14} className="text-text-muted"/> {acc.name}</h4>
                          <p className="text-xs text-text-muted mt-1">Days covered: Day {acc.fromDay || 1} — Day {acc.toDay || tripDuration}</p>
                          {acc.checkIn && acc.checkOut && (
                            <p className="text-[10px] text-text-muted mt-0.5">Dates: {new Date(acc.checkIn).toLocaleDateString()} to {new Date(acc.checkOut).toLocaleDateString()}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {acc.pricePerNight > 0 && <p className="font-bold text-navy text-sm">₹{acc.pricePerNight}/night</p>}
                          <button onClick={() => handleDeleteHotel(acc._id)} className="text-danger/60 hover:text-danger text-xs bg-transparent border-0 cursor-pointer mt-1 font-medium">Remove</button>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-border-light flex gap-2">
                        <button onClick={() => setAccMode('browse')} className="text-xs text-primary font-semibold bg-transparent border-0 cursor-pointer flex items-center gap-1"><Edit size={12}/> Change Hotel</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {accMode === 'browse' && (
                <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Browse Hotels</h3>
                    <button onClick={() => setAccMode('')} className="text-xs text-text-muted hover:text-navy bg-transparent border-0 cursor-pointer font-semibold">Cancel</button>
                  </div>
                  <button onClick={() => setAccMode('booked')} className="mb-4 w-full bg-bg border border-border hover:border-primary/40 text-navy font-semibold py-3 rounded-xl transition-all duration-150 cursor-pointer text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Already Booked? Enter details manually
                  </button>
                  {hotelsLoading ? (
                    <div className="py-6 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/></div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {hotels.map((h, i) => (
                        <div key={i} className="bg-bg rounded-xl overflow-hidden border border-border flex flex-col sm:flex-row group">
                          <img src={h.image} alt={h.name} loading="lazy" className="w-full sm:w-28 h-28 object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-navy text-sm line-clamp-1">{h.name}</h4>
                              <div className="flex items-center gap-0.5 bg-success text-white px-1.5 rounded text-[10px] font-bold"><Star size={8} fill="#fff" strokeWidth={0}/> {h.rating}</div>
                            </div>
                            <div className="flex items-center gap-2 mt-1 mb-2">
                              {h.amenities.map((am, idx) => { const AIcon = am.Icon; return <div key={idx} className="flex gap-0.5 items-center text-text-secondary"><AIcon size={10}/><span className="text-[9px]">{am.l}</span></div>; })}
                            </div>
                            <div className="flex justify-between items-end">
                              <div><p className="text-sm font-bold text-navy leading-none">₹{h.price.toLocaleString()}</p><p className="text-[9px] text-text-muted">per night • {h.distance}</p></div>
                              <button onClick={() => { setAccForm(p => ({ ...p, name: h.name, pricePerNight: h.price })); setAccMode('booked'); }} className="bg-accent hover:bg-accent-dark text-white px-3 py-1.5 rounded-lg text-[11px] font-bold border-0 cursor-pointer">Select</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 border-t border-border pt-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Book via</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { l: 'OYO',         url: 'oyorooms.com' },
                      { l: 'MakeMyTrip',  url: `makemytrip.com/hotels/hotel-listing/?city=${encodeURIComponent(trip.destination)}` },
                      { l: 'Booking.com', url: `booking.com/searchresults.html?ss=${encodeURIComponent(trip.destination)}` },
                      { l: 'Goibibo',     url: `goibibo.com/hotels/find-hotels-in-${encodeURIComponent(trip.destination)}/` },
                    ].map(b => (
                      <a key={b.l} href={`https://www.${b.url}`} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-1 px-3 py-2 rounded border border-navy text-navy text-xs font-semibold no-underline hover:bg-navy hover:text-white">
                        <ExternalLink size={10} /> {b.l}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {accMode === 'booked' && (
                <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-3 relative">
                  <button onClick={() => setAccMode('browse')} className="absolute top-4 right-4 text-xs text-text-muted hover:text-navy bg-transparent border-0 cursor-pointer font-bold">✕ Cancel</button>
                  <h3 className="font-bold text-navy text-sm mb-4">Hotel Details</h3>
                  <div><label className="block text-xs font-medium text-navy mb-1">Hotel Name *</label><input type="text" value={accForm.name} onChange={e => setAccForm(p => ({...p, name: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-navy mb-1">Check-in</label><DatePicker selected={accForm.checkIn ? new Date(accForm.checkIn + 'T12:00:00') : null} onChange={d => setAccForm(p => ({...p, checkIn: d ? toDateStr(d) : ''}))} dateFormat="yyyy-MM-dd" className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholderText="YYYY-MM-DD" wrapperClassName="w-full" /></div>
                    <div><label className="block text-xs font-medium text-navy mb-1">Check-out</label><DatePicker selected={accForm.checkOut ? new Date(accForm.checkOut + 'T12:00:00') : null} onChange={d => setAccForm(p => ({...p, checkOut: d ? toDateStr(d) : ''}))} dateFormat="yyyy-MM-dd" className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholderText="YYYY-MM-DD" wrapperClassName="w-full" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="block text-xs font-medium text-navy mb-1">From Day</label><input type="number" min="1" value={accForm.fromDay} onChange={e => setAccForm(p => ({...p, fromDay: e.target.value}))} placeholder="1" className="w-full border border-border rounded-lg px-3 py-2 text-sm" /></div>
                    <div><label className="block text-xs font-medium text-navy mb-1">To Day</label><input type="number" min="1" value={accForm.toDay} onChange={e => setAccForm(p => ({...p, toDay: e.target.value}))} placeholder={tripDuration || 7} className="w-full border border-border rounded-lg px-3 py-2 text-sm" /></div>
                    <div><label className="block text-xs font-medium text-navy mb-1">Price/Night (₹)</label><input type="number" min="0" value={accForm.pricePerNight} onChange={e => setAccForm(p => ({...p, pricePerNight: e.target.value}))} placeholder="0" className="w-full border border-border rounded-lg px-3 py-2 text-sm" /></div>
                  </div>
                  <button onClick={handleSaveHotel} disabled={!accForm.name.trim()} className="w-full bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-bold py-2 rounded-lg text-sm border-0 cursor-pointer mt-2 transition-colors">Save Hotel</button>
                  <button onClick={() => setAccMode('')} className="w-full text-text-muted hover:text-navy cursor-pointer bg-transparent border-0 px-0 py-2 text-xs font-semibold">Skip for now</button>
                </div>
              )}
            </div>

            {/* ── DINING TAB — only renders if visited ── */}
            {hasCoordinates && visitedTabs.has('dining') && (
              <div className={activeSection === 'dining' ? 'block' : 'hidden'}>
                <div className="bg-white rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <Suspense fallback={
                    <div className="space-y-4 animate-pulse">
                      <div className="flex gap-2">{[1,2,3].map(k => <div key={k} className="h-8 w-20 bg-border rounded-full"/>)}</div>
                      <div className="grid sm:grid-cols-2 gap-4">{[1,2,3,4].map(k => <div key={k} className="h-40 bg-border/40 rounded-xl"/>)}</div>
                      <div className="h-[280px] bg-border/40 rounded-xl"/>
                    </div>
                  }>
                    <DiningNearby latitude={trip.latitude} longitude={trip.longitude} />
                  </Suspense>
                </div>
              </div>
            )}
            {/* Placeholder when dining tab not visited yet */}
            {hasCoordinates && !visitedTabs.has('dining') && activeSection === 'dining' && (
              <div className="bg-white rounded-xl border border-border p-6">
                <div className="space-y-4 animate-pulse">
                  <div className="flex gap-2">{[1,2,3].map(k => <div key={k} className="h-8 w-20 bg-border rounded-full"/>)}</div>
                  <div className="grid sm:grid-cols-2 gap-4">{[1,2,3,4].map(k => <div key={k} className="h-40 bg-border/40 rounded-xl"/>)}</div>
                </div>
              </div>
            )}

            {/* ── SIGHTSEEING TAB — only renders if visited ── */}
            {hasCoordinates && visitedTabs.has('sightseeing') && (
              <div className={activeSection === 'sightseeing' ? 'block' : 'hidden'}>
                <div className="bg-white rounded-xl border border-border p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <Suspense fallback={
                    <div className="space-y-4 animate-pulse">
                      <div className="flex gap-2">{[1,2,3,4].map(k => <div key={k} className="h-8 w-24 bg-border rounded-full"/>)}</div>
                      <div className="grid sm:grid-cols-2 gap-4">{[1,2,3,4].map(k => <div key={k} className="h-44 bg-border/40 rounded-xl"/>)}</div>
                      <div className="h-[280px] bg-border/40 rounded-xl"/>
                    </div>
                  }>
                    <SightseeingNearby latitude={trip.latitude} longitude={trip.longitude} />
                  </Suspense>
                </div>
              </div>
            )}
            {hasCoordinates && !visitedTabs.has('sightseeing') && activeSection === 'sightseeing' && (
              <div className="bg-white rounded-xl border border-border p-6">
                <div className="space-y-4 animate-pulse">
                  <div className="flex gap-2">{[1,2,3,4].map(k => <div key={k} className="h-8 w-24 bg-border rounded-full"/>)}</div>
                  <div className="grid sm:grid-cols-2 gap-4">{[1,2,3,4].map(k => <div key={k} className="h-44 bg-border/40 rounded-xl"/>)}</div>
                </div>
              </div>
            )}

            {/* ── MAP / EXPLORE TAB — only renders if visited ── */}
            {hasCoordinates && visitedTabs.has('explore') && (
              <div className={activeSection === 'explore' ? 'block' : 'hidden'}>
                <div className="bg-white rounded-xl border border-border p-0 overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <Suspense fallback={
                    <div className="h-[350px] flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full animate-spin border-2 border-border border-t-primary" />
                      <p className="text-text-muted text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Loading map...</p>
                    </div>
                  }>
                    <TripMap latitude={trip.latitude} longitude={trip.longitude} destination={trip.destination} nearbyPlaces={nearbyPlaces} />
                  </Suspense>
                </div>
                <NearbyPlaces tripId={trip._id} latitude={trip.latitude} longitude={trip.longitude} onPlacesLoaded={setNearbyPlaces} />
              </div>
            )}
            {hasCoordinates && !visitedTabs.has('explore') && activeSection === 'explore' && (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="h-[350px] flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full animate-spin border-2 border-border border-t-primary" />
                  <p className="text-text-muted text-sm">Loading map...</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
