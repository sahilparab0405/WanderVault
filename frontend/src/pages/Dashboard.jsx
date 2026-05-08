import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TripCard from '../components/TripCard';
import { useToast } from '../components/Toast';
import { 
  Plane, AlertTriangle, Search, PlusCircle, 
  MapPin, Calendar, ArrowRight, CheckCircle,
  Copy, SlidersHorizontal, ChevronDown
} from 'lucide-react';
import Logo from '../components/Logo';
import DashboardAnalytics from '../components/DashboardAnalytics';

// Lazy load map to keep initial payload small
const TripMap = lazy(() => import('../components/TripMap'));

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cloneTarget, setCloneTarget] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterBudgetMin, setFilterBudgetMin] = useState('');
  const [filterBudgetMax, setFilterBudgetMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const fetchTrips = async () => {
    try {
      const { data } = await API.get('/trips');
      setTrips(data);
    } catch {
      // Error fetching trips
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTrips(); }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/trips/${deleteTarget.id}`);
      setTrips(prev => prev.filter(t => t._id !== deleteTarget.id));
      toast.success(`"${deleteTarget.name}" has been deleted.`, 'Trip Deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete trip. Please try again.', 'Delete Failed');
    }
  };

  const handleClone = async () => {
    if (!cloneTarget) return;
    setIsCloning(true);
    try {
      const { data: newTrip } = await API.post(`/trips/${cloneTarget._id}/clone`);
      toast.success(`"${cloneTarget.name}" cloned successfully!`, 'Trip Cloned');
      setCloneTarget(null);
      navigate(`/trip/${newTrip._id}`);
    } catch {
      toast.error('Failed to clone trip. Please try again.', 'Clone Failed');
    }
    setIsCloning(false);
  };

  const filteredTrips = useMemo(() => {
    let result = [...trips];

    // Search by name/destination
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q));
    }

    // Filter by date range
    if (filterDateFrom) {
      result = result.filter(t => new Date(t.startDate) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      result = result.filter(t => new Date(t.endDate) <= new Date(filterDateTo));
    }

    // Filter by budget range
    if (filterBudgetMin) {
      result = result.filter(t => t.budget >= Number(filterBudgetMin));
    }
    if (filterBudgetMax) {
      result = result.filter(t => t.budget <= Number(filterBudgetMax));
    }

    // Sorting
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        break;
      case 'budget-high':
        result.sort((a, b) => b.budget - a.budget);
        break;
      case 'budget-low':
        result.sort((a, b) => a.budget - b.budget);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        break;
    }

    return result;
  }, [trips, searchQuery, sortBy, filterDateFrom, filterDateTo, filterBudgetMin, filterBudgetMax]);

  const activeTrip = useMemo(() => {
    const now = new Date();
    return trips.find(t => {
      const start = new Date(t.startDate);
      const end = new Date(t.endDate);
      return start <= now && end >= now;
    }) || trips[0]; // Fallback to most recent if none active
  }, [trips]);

  if (loading) return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Skeleton: Spotlight */}
        <div className="h-64 bg-white rounded-2xl animate-pulse border border-border" />
        {/* Skeleton: Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-border" />)}
        </div>
        {/* Skeleton: Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-72 bg-white rounded-2xl animate-pulse border border-border" />
          <div className="h-72 bg-white rounded-2xl animate-pulse border border-border" />
        </div>
        {/* Skeleton: Trip list */}
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-border" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      
      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-border px-8 py-6 flex items-center justify-between sticky top-0 z-30 shadow-sm shadow-navy/5">
        <div className="flex items-center gap-6">
          <div className="hidden lg:block scale-90 origin-left">
             <Logo size="md" dark={false} />
          </div>
          <div className="h-8 w-px bg-border hidden lg:block" />
          <div>
            <h1 className="text-xl font-black text-navy leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded- bg-success animate-pulse" />
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                Active Session for {user?.name?.split(' ')[0] || 'Traveler'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search trips..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-6 py-2 bg-bg border border-border rounded- text-xs w-48 focus:w-64 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
            />
          </div>
          <Link
            to="/create-trip"
            className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-6 py-2.5 rounded- text-xs font-bold no-underline transition-all shadow-lg shadow-accent/20 hover:-translate-y-0.5"
          >
            <PlusCircle size={16} /> New Trip
          </Link>
          <div className="w-9 h-9 rounded- bg-navy text-white flex items-center justify-center text-xs font-black shadow-inner">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
        
        {/* Error Message */}
        {errorMsg && (
          <div className="bg-danger/10 border border-danger text-danger p-6 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="shrink-0" />
            <p className="text-sm font-semibold">{errorMsg}</p>
            <button onClick={() => setErrorMsg('')} className="ml-auto text-danger hover:text-danger-dark border-0 bg-transparent cursor-pointer">✕</button>
          </div>
        )}

        {trips.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-border p-12 text-center space-y-6 max-w-3xl mx-auto mt-10 shadow-sm">
            <div className="w-24 h-24 bg-accent/10 text-accent rounded- flex items-center justify-center mx-auto">
              <Plane size={48} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Welcome to WanderVault! 🌍</h2>
              <p className="text-text-secondary mt-3 text-lg" style={{ fontFamily: "'Inter', sans-serif" }}>
                You don't have any trips yet. Start planning your first adventure to track your expenses, itinerary, and memories all in one place.
              </p>
            </div>
            <Link to="/create-trip" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-8 py-6 rounded-xl font-black text-sm no-underline shadow-xl shadow-accent/20 transition-all hover:-translate-y-1">
              <PlusCircle size={18} /> Plan Your First Trip
            </Link>
          </div>
        ) : (
          <>
          {/* ── Spotlight: Active Trip ── */}
          {activeTrip ? (
            <section className="bg-white rounded-3xl border border-border overflow-hidden shadow-xl shadow-navy/5 grid lg:grid-cols-5 min-h-[400px]">
            <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col justify-between space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-6 py-1 rounded- text-[10px] font-bold uppercase tracking-widest mb-4">
                  <CheckCircle size={10} /> Active Adventure
                </div>
                <h2 className="text-4xl font-black text-navy leading-none mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {activeTrip.name}
                </h2>
                <p className="text-lg text-text-secondary flex items-center gap-2">
                  <MapPin size={20} className="text-accent" /> {activeTrip.destination}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg rounded- p-6 border border-border">
                  <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Total Spent</p>
                  <p className="text-xl font-black text-navy">₹{activeTrip.totalExpense?.toLocaleString()}</p>
                </div>
                <div className="bg-bg rounded- p-6 border border-border">
                  <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Budget Left</p>
                  <p className={`text-xl font-black ${activeTrip.budgetExceeded ? 'text-danger' : 'text-success'}`}>
                    ₹{(activeTrip.budget - activeTrip.totalExpense).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Link to={`/trip/${activeTrip._id}`} className="flex-1 bg-navy text-white py-6 rounded- text-sm font-bold no-underline text-center hover:bg-navy-dark transition-all shadow-lg shadow-navy/20">
                  Manage Trip
                </Link>
                <Link to={`/trip/${activeTrip._id}/itinerary`} className="flex-1 bg-bg border border-border text-navy py-6 rounded- text-sm font-bold no-underline text-center hover:bg-white transition-all">
                  Itinerary
                </Link>
              </div>
            </div>
            <div className="lg:col-span-3 bg-bg relative min-h-[300px]">
              <Suspense fallback={<div className="h-full w-full bg-border/20 animate-pulse flex items-center justify-center text-text-muted text-xs">Loading Live Map...</div>}>
                <TripMap 
                  latitude={activeTrip.latitude} 
                  longitude={activeTrip.longitude} 
                  destination={activeTrip.destination} 
                />
              </Suspense>
            </div>
          </section>
        ) : (
          /* Empty Active Trip State */
          <div className="bg-white rounded-3xl border-2 border-dashed border-border p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-accent/10 text-accent rounded- flex items-center justify-center mx-auto">
              <Plane size={36} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy">Ready for your next adventure?</h2>
              <p className="text-text-secondary mt-2">Create a new trip to start tracking your travel memories and expenses.</p>
            </div>
            <Link to="/create-trip" className="inline-flex items-center gap-2 bg-accent text-white px-8 py-6 rounded- font-black text-sm no-underline shadow-xl shadow-accent/20">
              <PlusCircle size={18} /> Plan New Trip
            </Link>
          </div>
        )}

        {/* ── Analytics Section ── */}
        <DashboardAnalytics trips={trips} />

        {/* ── Trip List Section ── */}
        <div className="space-y-6">
          {/* Filter & Sort Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-black text-navy flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <Calendar size={20} className="text-primary" /> Your Trips
            </h3>
            <div className="flex items-center gap-2">
              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                  showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'
                }`}
              >
                <SlidersHorizontal size={14} /> Filters
                {(filterDateFrom || filterDateTo || filterBudgetMin || filterBudgetMax) && (
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
              </button>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-border text-text-secondary text-xs font-bold px-4 py-2 pr-8 rounded-xl cursor-pointer hover:border-primary focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="budget-high">Budget: High → Low</option>
                  <option value="budget-low">Budget: Low → High</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>

              {filteredTrips.length > 0 && (
                <span className="text-[10px] font-bold text-text-muted bg-white border border-border px-4 py-1.5 rounded-xl uppercase">
                  {filteredTrips.length} Total
                </span>
              )}
            </div>
          </div>

          {/* Expandable Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-border p-5 animate-in fade-in slide-in-from-top-2 duration-300" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-navy uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Filter Trips</p>
                <button
                  onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setFilterBudgetMin(''); setFilterBudgetMax(''); }}
                  className="text-[10px] font-bold text-accent hover:text-accent-dark bg-transparent border-0 cursor-pointer"
                >Clear All</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Date From</label>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-bg focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Date To</label>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-bg focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Min Budget (₹)</label>
                  <input type="number" min="0" placeholder="0" value={filterBudgetMin} onChange={e => setFilterBudgetMin(e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-bg focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Max Budget (₹)</label>
                  <input type="number" min="0" placeholder="∞" value={filterBudgetMax} onChange={e => setFilterBudgetMax(e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-bg focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>
            </div>
          )}

          {/* Trip Cards */}
          <div className="grid gap-5">
            {filteredTrips.slice(0, 8).map(trip => (
              <div key={trip._id} className="group bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl hover:shadow-navy/5 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-bg rounded-xl border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Plane size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-navy group-hover:text-primary transition-colors">{trip.name}</h4>
                      <p className="text-xs text-text-secondary mt-0.5">{trip.destination}</p>
                      <div className="flex items-center gap-3 mt-2">
                         <span className="text-[10px] font-bold text-text-muted bg-bg px-2 py-0.5 rounded-lg border border-border">{new Date(trip.startDate).toLocaleDateString()}</span>
                         <span className={`text-[10px] font-bold ${trip.budgetExceeded ? 'text-danger' : 'text-success'}`}>₹{trip.totalExpense?.toLocaleString()} / ₹{trip.budget?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link to={`/trip/${trip._id}`} className="bg-bg hover:bg-navy hover:text-white p-2.5 rounded-xl transition-all border border-border">
                      <ArrowRight size={16} />
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCloneTarget(trip); }}
                      className="bg-bg hover:bg-primary hover:text-white text-text-muted p-2 rounded-xl transition-all border border-border cursor-pointer"
                      title="Clone trip"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredTrips.length === 0 && !loading && (
              <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-border px-6">
                <Search size={32} className="text-text-muted mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold text-navy">No trips found matching your criteria</p>
                <p className="text-xs text-text-muted mt-1">Try adjusting your filters or search query.</p>
                <button onClick={() => { setSearchQuery(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterBudgetMin(''); setFilterBudgetMax(''); }} className="text-xs text-accent font-bold mt-3 bg-transparent border-0 cursor-pointer">Clear All Filters</button>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-md p-6">
          <div className="bg-white rounded-3xl max-w-md w-full p-10 border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-center w-20 h-20 rounded- bg-danger/10 text-danger mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-black text-navy text-center mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Confirm Delete?
            </h3>
            <p className="text-text-secondary text-center mb-8 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-navy">{deleteTarget.name}</span>? This will permanently erase all associated expenses and itinerary data.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="py-6 rounded- font-bold bg-bg text-navy hover:bg-border transition-all cursor-pointer border-0"
              >
                No, Keep it
              </button>
              <button 
                onClick={confirmDelete}
                className="py-6 rounded- font-bold text-white bg-danger hover:bg-red-600 transition-all cursor-pointer border-0 shadow-lg shadow-danger/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Confirmation Modal (Area 5 Feature C) */}
      {cloneTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-md p-6">
          <div className="bg-white rounded-3xl max-w-md w-full p-10 border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-center w-20 h-20 rounded- bg-primary/10 text-primary mb-6 mx-auto">
              <Copy size={32} />
            </div>
            <h3 className="text-2xl font-black text-navy text-center mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Clone {cloneTarget.name}?
            </h3>
            <p className="text-text-secondary text-center mb-8 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              Creates a copy with same itinerary but empty expenses. You can edit everything after cloning.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setCloneTarget(null)}
                className="py-6 rounded- font-bold bg-bg text-navy hover:bg-border transition-all cursor-pointer border-0"
              >
                Cancel
              </button>
              <button 
                onClick={handleClone}
                disabled={isCloning}
                className="py-6 rounded- font-bold text-white bg-primary hover:bg-primary-dark transition-all cursor-pointer border-0 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {isCloning ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded- animate-spin" /> Cloning...</> : <><Copy size={16} /> Clone Trip</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}