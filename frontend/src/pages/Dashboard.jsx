import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TripCard from '../components/TripCard';
import { TripCardSkeleton, StatCardSkeleton } from '../components/Skeleton';
import { 
  Plane, DollarSign, Shield, AlertTriangle, Search, PlusCircle, 
  MapPin, Calendar, ArrowRight, BarChart2, CheckCircle, TrendingUp, Info,
  Copy
} from 'lucide-react';
import Logo from '../components/Logo';

// Lazy load map to keep initial payload small
const TripMap = lazy(() => import('../components/TripMap'));

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cloneTarget, setCloneTarget] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async () => {
    try {
      const { data } = await API.get('/trips');
      setTrips(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/trips/${deleteTarget.id}`);
      setTrips(trips.filter(t => t._id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) { console.error(err); }
  };

  const handleClone = async () => {
    if (!cloneTarget) return;
    setIsCloning(true);
    try {
      const { data: newTrip } = await API.post(`/trips/${cloneTarget._id}/clone`);
      setCloneTarget(null);
      navigate(`/trip/${newTrip._id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to clone trip.');
    }
    setIsCloning(false);
  };

  const totalSpent = trips.reduce((sum, t) => sum + (t.totalExpense || 0), 0);
  const onBudget = trips.filter(t => !t.budgetExceeded).length;
  const overBudget = trips.filter(t => t.budgetExceeded).length;

  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const q = searchQuery.toLowerCase();
    return trips.filter(t => t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q));
  }, [trips, searchQuery]);

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
        <div className="h-64 bg-white rounded- animate-pulse border border-border" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-40 bg-white rounded- animate-pulse" />
            <div className="h-40 bg-white rounded- animate-pulse" />
          </div>
          <div className="space-y-6">
             <div className="h-80 bg-white rounded- animate-pulse" />
          </div>
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

        {/* ── Main Dashboard Grid ── */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Trip List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-navy flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <Calendar size={20} className="text-primary" /> Recent Trips
              </h3>
              {filteredTrips.length > 0 && (
                 <span className="text-[10px] font-bold text-text-muted bg-white border border-border px-6 py-1 rounded- uppercase">
                   {filteredTrips.length} Total
                 </span>
              )}
            </div>

            <div className="grid gap-6">
              {filteredTrips.slice(0, 5).map(trip => (
                <div key={trip._id} className="group bg-white rounded- p-6 border border-border shadow-sm hover:shadow-xl hover:shadow-navy/5 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded- -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex gap-4 items-center">
                      <div className="w-14 h-14 bg-bg rounded- border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <Plane size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-navy group-hover:text-primary transition-colors">{trip.name}</h4>
                        <p className="text-xs text-text-secondary mt-0.5">{trip.destination}</p>
                        <div className="flex items-center gap-3 mt-2">
                           <span className="text-[10px] font-bold text-text-muted bg-bg px-2 py-0.5 rounded-xl border border-border">{new Date(trip.startDate).toLocaleDateString()}</span>
                           <span className={`text-[10px] font-bold ${trip.budgetExceeded ? 'text-danger' : 'text-success'}`}>₹{trip.totalExpense?.toLocaleString()} spent</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link to={`/trip/${trip._id}`} className="bg-bg hover:bg-navy hover:text-white p-2.5 rounded- transition-all border border-border">
                        <ArrowRight size={16} />
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCloneTarget(trip); }}
                        className="bg-bg hover:bg-primary hover:text-white text-text-muted p-2 rounded- transition-all border border-border cursor-pointer"
                        title="Clone trip"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTrips.length === 0 && !loading && (
                <div className="text-center py-12 bg-white/50 rounded- border border-dashed border-border px-6">
                  <Search size={32} className="text-text-muted mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold text-navy">No trips found matching your search</p>
                  <button onClick={() => setSearchQuery('')} className="text-xs text-accent font-bold mt-2 bg-transparent border-0 cursor-pointer">Clear Search</button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Stats & Analytics */}
          <div className="space-y-6">
            <h3 className="text-lg font-black text-navy flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <TrendingUp size={20} className="text-accent" /> Insights
            </h3>
            
            <div className="space-y-4">
              {/* Stat Summary */}
              <div className="bg-navy rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-navy/20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded- -mr-20 -mt-20" />
                <div className="relative z-10">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Lifetime Spend</p>
                  <p className="text-4xl font-black mb-1">₹{totalSpent >= 100000 ? (totalSpent/100000).toFixed(1)+'L' : totalSpent.toLocaleString()}</p>
                  <div className="flex items-center gap-1.5 text-success-light text-[10px] font-bold mt-4">
                    <CheckCircle size={12} /> {onBudget} Trips within budget
                  </div>
                </div>
              </div>

              {/* Quick Analytics Cards */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white rounded- p-6 border border-border shadow-sm">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
                      <PlusCircle size={18} />
                    </div>
                    <p className="text-[10px] font-bold text-text-muted uppercase">Total Trips</p>
                    <p className="text-xl font-black text-navy">{trips.length}</p>
                 </div>
                 <div className="bg-white rounded- p-6 border border-border shadow-sm">
                    <div className="w-8 h-8 bg-danger/10 text-danger rounded-xl flex items-center justify-center mb-3">
                      <AlertTriangle size={18} />
                    </div>
                    <p className="text-[10px] font-bold text-text-muted uppercase">Health</p>
                    <p className="text-xl font-black text-navy">{overBudget} Peak</p>
                 </div>
              </div>

              {/* Tips / CTR */}
              <div className="bg-accent/10 rounded- p-6 border border-accent/20">
                 <div className="flex gap-3">
                    <div className="w-10 h-10 bg-accent text-white rounded- flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
                       <BarChart2 size={20} />
                    </div>
                    <div>
                       <h5 className="font-bold text-navy text-sm">Save your data!</h5>
                       <p className="text-xs text-text-secondary mt-1">Users who track daily expenses save 24% more on average.</p>
                       <Link to="/budget" className="inline-flex items-center gap-1 text-[10px] font-bold text-accent mt-3 no-underline border-b border-accent pb-0.5">VIEW ANALYTICS →</Link>
                    </div>
                 </div>
              </div>

              {/* Location Insight */}
              <div className="bg-white rounded-3xl p-6 border border-border shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                    <h5 className="font-bold text-navy text-xs uppercase tracking-wider">Top Destination</h5>
                    <Info size={14} className="text-text-muted" />
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded- overflow-hidden bg-bg border border-border">
                       <img src="https://images.unsplash.com/photo-1548013146-72479768bada?w=200&h=200&fit=crop" alt="India" className="w-full h-full object-cover" />
                    </div>
                    <div>
                       <p className="font-black text-navy">Goa, IN</p>
                       <p className="text-[10px] text-text-secondary mt-0.5">Visited {trips.filter(t => t.destination.includes('Goa')).length} times</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
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