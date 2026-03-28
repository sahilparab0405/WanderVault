import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import TripCard from '../components/TripCard';

// MOCK DATA for Demo
const MOCK_TRIPS = [
  { _id: '1', name: 'Goa Beach Getaway', destination: 'Goa, India', startDate: '2026-03-20', endDate: '2026-03-25', travelMode: 'Train', budget: 25000, totalExpense: 18200, budgetExceeded: false, imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80' },
  { _id: '2', name: 'Manali Winter Trip', destination: 'Manali, India', startDate: '2026-01-10', endDate: '2026-01-15', travelMode: 'Flight', budget: 12000, totalExpense: 15800, budgetExceeded: true, imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80' }
];
const MOCK_USER = { name: 'Sahil' };

export default function DashboardDemo() {
  const [trips, setTrips] = useState(MOCK_TRIPS);
  const [searchQuery, setSearchQuery] = useState('');
  const user = MOCK_USER;

  const totalSpent = trips.reduce((sum, t) => sum + (t.totalExpense || 0), 0);
  const onBudget = trips.filter(t => !t.budgetExceeded).length;
  const overBudget = trips.filter(t => t.budgetExceeded).length;

  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const lowerQ = searchQuery.toLowerCase();
    return trips.filter(t => 
      t.name.toLowerCase().includes(lowerQ) || 
      t.destination.toLowerCase().includes(lowerQ)
    );
  }, [trips, searchQuery]);

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Hero Section */}
        <div className="mb-10 bg-white p-6 sm:p-8 rounded-2xl border border-border-light relative overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-navy tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Where to next, {user?.name?.split(' ')[0] || 'Traveler'}? <span className="inline-block animate-bounce origin-bottom w-min">👋</span>
              </h1>
              <p className="text-text-secondary mt-2 text-sm sm:text-base max-w-lg leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                Manage your itineraries, track expenses, and discover nearby places across all your upcoming adventures.
              </p>
              
              <div className="mt-6 max-w-md relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-muted">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search by destination or trip name..."
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-bg border border-border-light rounded-xl text-navy text-sm font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <button className="group flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 border-0" style={{ fontFamily: "'Inter', sans-serif", boxShadow: 'var(--shadow-md)' }}>
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:rotate-90">
                  <span className="text-white text-lg leading-none mt-[-2px]">+</span>
                </div>
                Plan New Trip
              </button>
              <button className="flex items-center justify-center gap-2 bg-white hover:bg-bg border border-border-light hover:border-border text-navy px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 border-0" style={{ fontFamily: "'Inter', sans-serif", boxShadow: 'var(--shadow-sm)' }}>
                <span className="text-lg">📊</span>
                Budget Overview
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <h3 className="text-lg font-bold text-navy mb-4 px-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border transition-all hover:border-primary-100 flex flex-col relative overflow-hidden group" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary mb-3"><span className="text-xl">✈️</span></div>
            <p className="text-3xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>{trips.length}</p>
            <p className="text-text-secondary text-xs sm:text-sm mt-0.5 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Total Trips</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border transition-all hover:border-primary-100 flex flex-col relative overflow-hidden group" style={{ boxShadow: 'var(--shadow-sm)' }}>
             <div className="w-10 h-10 rounded-full bg-navy/5 flex items-center justify-center text-navy mb-3"><span className="text-xl">💸</span></div>
             <p className="text-3xl font-bold text-navy uppercase" style={{ fontFamily: "'Poppins', sans-serif" }}>₹{(totalSpent / 1000).toFixed(1)}K</p>
             <p className="text-text-secondary text-xs sm:text-sm mt-0.5 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Total Spent</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border transition-all hover:border-success/30 flex flex-col relative overflow-hidden group" style={{ boxShadow: 'var(--shadow-sm)' }}>
             <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success mb-3"><span className="text-xl">🛡️</span></div>
             <p className="text-3xl font-bold text-success" style={{ fontFamily: "'Poppins', sans-serif" }}>{onBudget}</p>
             <p className="text-text-secondary text-xs sm:text-sm mt-0.5 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>On Budget</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border transition-all hover:border-danger/30 flex flex-col relative overflow-hidden group" style={{ boxShadow: 'var(--shadow-sm)' }}>
             <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-3"><span className="text-xl">⚠️</span></div>
             <p className="text-3xl font-bold text-danger" style={{ fontFamily: "'Poppins', sans-serif" }}>{overBudget}</p>
             <p className="text-text-secondary text-xs sm:text-sm mt-0.5 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Over Budget</p>
          </div>
        </div>

        {/* Trip Cards */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Your Itineraries</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {filteredTrips.map(trip => (
            <TripCard key={trip._id} trip={trip} onDelete={() => setTrips(trips.filter(t => t._id !== trip._id))} />
          ))}
        </div>
      </div>
    </div>
  );
}
