import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TripCard from '../components/TripCard';
import { TripCardSkeleton, StatCardSkeleton } from '../components/Skeleton';
import { Plane, DollarSign, Shield, AlertTriangle, Search, PlusCircle, Plus, BarChart2, MapPin } from 'lucide-react';
import Logo from '../components/Logo';

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const totalSpent = trips.reduce((sum, t) => sum + (t.totalExpense || 0), 0);
  const onBudget = trips.filter(t => !t.budgetExceeded).length;
  const overBudget = trips.filter(t => t.budgetExceeded).length;

  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const q = searchQuery.toLowerCase();
    return trips.filter(t => t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q));
  }, [trips, searchQuery]);

  const now = new Date();
  const upcoming = trips.filter(t => new Date(t.startDate) > now).length;

  return (
    <div className="min-h-screen bg-bg">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between"
           style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center gap-4">
          <div className="hidden lg:block lg:mb-1">
             <Logo size="sm" dark={false} />
          </div>
          <div className="lg:hidden">
             <Logo size="sm" dark={false} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy leading-tight"
                style={{ fontFamily: "'Poppins', sans-serif" }}>
              Dashboard
            </h1>
            <p className="text-xs text-text-secondary mt-0.5"
               style={{ fontFamily: "'Inter', sans-serif" }}>
              Welcome back, {user?.name?.split(' ')[0] || 'Traveler'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search trips..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-bg text-navy focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all w-52"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </div>
          {/* Create button */}
          <Link
            to="/create-trip"
            id="dashboard-create-btn"
            className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-all duration-150 hover:-translate-y-px"
            style={{ fontFamily: "'Inter', sans-serif", boxShadow: '0 2px 8px rgba(255,107,53,0.35)' }}
          >
            <PlusCircle size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">New Trip</span>
          </Link>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold uppercase shrink-0"
               style={{ background: 'linear-gradient(135deg, #1a2b4a, #2a3d5e)', color: '#fff', fontFamily: "'Poppins', sans-serif" }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-4 pt-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search trips..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white text-navy focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 space-y-6">

        {/* ── Stats Row ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Trips', value: trips.length, Icon: Plane, color: 'text-primary', bg: 'bg-primary-50' },
              { label: 'Total Spent', value: `₹${totalSpent >= 1000 ? (totalSpent/1000).toFixed(1)+'K' : totalSpent}`, Icon: DollarSign, color: 'text-navy', bg: 'bg-navy/5' },
              { label: 'On Budget', value: onBudget, Icon: Shield, color: 'text-success', bg: 'bg-success/10' },
              { label: 'Over Budget', value: overBudget, Icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
            ].map(({ label, value, Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl p-4 border border-border flex flex-col gap-3 relative overflow-hidden group hover:border-primary/20 transition-all duration-200"
                   style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>{value}</p>
                  <p className="text-xs text-text-secondary mt-1 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</p>
                </div>
                <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                     style={{ background: 'var(--color-primary)', opacity: 0.04 }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Quick actions bar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/budget-demo"
            className="flex items-center gap-2 bg-white border border-border text-navy px-4 py-2 rounded-lg text-sm font-semibold no-underline hover:border-primary/30 hover:bg-primary-50 transition-all duration-150"
            style={{ fontFamily: "'Inter', sans-serif", boxShadow: 'var(--shadow-sm)' }}>
            <BarChart2 size={15} strokeWidth={1.5} className="text-primary" />
            Budget Analytics
          </Link>
          <Link to="/accommodation-demo"
            className="flex items-center gap-2 bg-white border border-border text-navy px-4 py-2 rounded-lg text-sm font-semibold no-underline hover:border-accent/30 hover:bg-accent-50 transition-all duration-150"
            style={{ fontFamily: "'Inter', sans-serif", boxShadow: 'var(--shadow-sm)' }}>
            <MapPin size={15} strokeWidth={1.5} className="text-accent" />
            Explore Places
          </Link>
          {upcoming > 0 && (
            <span className="text-xs font-semibold text-text-muted ml-auto"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
              {upcoming} upcoming {upcoming === 1 ? 'trip' : 'trips'}
            </span>
          )}
        </div>

        {/* ── Trip Cards ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
              My Trips
            </h2>
            {!loading && filteredTrips.length > 0 && searchQuery && (
              <span className="text-xs text-text-muted bg-border-light px-2 py-1 rounded-md font-semibold">
                {filteredTrips.length} result{filteredTrips.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[1,2,3,4].map(i => <TripCardSkeleton key={i} />)}
            </div>
          ) : filteredTrips.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredTrips.map(trip => (
                <TripCard key={trip._id} trip={trip} onDelete={id => setDeleteTarget({ id, name: trip.name })} />
              ))}
            </div>
          ) : trips.length > 0 ? (
            /* Search no result */
            <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-border">
              <Search size={36} strokeWidth={1.5} className="text-text-muted opacity-50 mx-auto mb-3" />
              <h4 className="text-navy font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>No matches found</h4>
              <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                Try adjusting your search query.
              </p>
            </div>
          ) : (
            /* Global empty state */
            <div className="relative overflow-hidden text-center py-20 px-4 bg-white rounded-3xl border border-border"
                 style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="absolute inset-0 pointer-events-none opacity-40"
                   style={{ backgroundImage: 'radial-gradient(#E5E7EB 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 mb-6 rounded-2xl bg-primary-50 flex items-center justify-center">
                  <Plane size={36} strokeWidth={1.5} className="text-primary" />
                </div>
                <h3 className="text-navy font-bold text-2xl mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  No trips added yet
                </h3>
                <p className="text-text-secondary text-sm mb-8 max-w-xs mx-auto leading-relaxed"
                   style={{ fontFamily: "'Inter', sans-serif" }}>
                  Create your first itinerary to start tracking expenses and planning your journey.
                </p>
                <Link
                  to="/create-trip"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-8 py-3.5 rounded-xl font-bold text-sm no-underline transition-all hover:-translate-y-1"
                  style={{ fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 14px rgba(255,107,53,0.4)' }}
                >
                  <Plus size={16} strokeWidth={1.5} />
                  Plan your first trip
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-border"
               style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.2)', fontFamily: "'Inter', sans-serif" }}>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-danger/10 text-danger mb-4 mx-auto">
              <AlertTriangle size={20} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-navy text-center mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Delete Trip
            </h3>
            <p className="text-text-secondary text-center mb-6 text-sm">
              Are you sure you want to delete <strong className="text-navy">{deleteTarget.name}</strong>?<br/>
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-xl font-semibold border border-border text-navy bg-white hover:bg-bg transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-danger hover:bg-red-600 transition-colors cursor-pointer border-0">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}