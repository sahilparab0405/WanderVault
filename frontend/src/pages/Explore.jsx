import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Compass, Utensils, MapPin, Building2, ExternalLink, 
  Plane, ArrowRight, Star, Heart, PlusCircle, Search,
  TrendingUp, Landmark, Map
} from 'lucide-react';
import { TripCardSkeleton } from '../components/Skeleton';

// Premium Discover Data
const POPULAR_DESTINATIONS = [
  { name: 'Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&h=400&fit=crop', budget: '₹15,000+', category: 'Beach' },
  { name: 'Manali', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&h=400&fit=crop', budget: '₹20,000+', category: 'Mountains' },
  { name: 'Munnar', image: 'https://images.unsplash.com/photo-1622309805370-ca556372befa?w=600&h=400&fit=crop', budget: '₹18,000+', category: 'Nature' },
  { name: 'Leh', image: 'https://images.unsplash.com/photo-1544085311-11a028465b03?w=600&h=400&fit=crop', budget: '₹40,000+', category: 'Adventure' },
];

const SEASONAL_HIGHLIGHTS = [
  { 
    name: 'Shimla', 
    image: 'https://images.unsplash.com/photo-1562670338-d1e432a472c3?w=800&h=500&fit=crop', 
    budget: '₹12,000+', 
    desc: 'The Queen of Hills comes alive this summer with pleasant weather and colonial charm.',
    rating: 4.8
  },
  { 
    name: 'Pondicherry', 
    image: 'https://images.unsplash.com/photo-1589735496660-318e8df5e27a?w=800&h=500&fit=crop', 
    budget: '₹10,000+', 
    desc: 'Stroll through the French Quarter and enjoy the coastal vibe of this unique territory.',
    rating: 4.7
  },
];

export default function Explore() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dining');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data } = await API.get('/trips');
      setTrips(data);
    } catch (err) {
      console.error('Failed to fetch trips', err);
    } finally {
      setLoading(false);
    }
  };

  const activeTrip = trips.find(t => {
    const now = new Date();
    return new Date(t.startDate) <= now && new Date(t.endDate) >= now;
  }) || trips[0];

  const pastTrips = trips.filter(t => new Date(t.endDate) < new Date()).slice(0, 3);

  const handlePlanTrip = (destination) => {
    navigate('/create-trip', { state: { prefillDestination: destination } });
  };

  if (loading) return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-10 w-48 bg-border/40 rounded-lg animate-pulse" />
        <div className="h-80 bg-white rounded-[2rem] animate-pulse border border-border" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      
      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-navy leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Explore
          </h1>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-0.5">
            Discover your next adventure
          </p>
        </div>
        <div className="flex gap-4">
           <div className="relative group hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Find a city..." 
                className="pl-9 pr-4 py-2 bg-bg border border-border rounded-xl text-xs w-48 focus:w-64 focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none"
              />
           </div>
           <Link to="/create-trip" className="bg-accent hover:bg-accent-dark text-white px-5 py-2.5 rounded-xl text-xs font-bold no-underline transition-all shadow-lg shadow-accent/20">
              New Trip
           </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8 space-y-12 animate-in fade-in duration-700">
        
        {/* SECTION 1 — ACTIVE TRIP CONTEXT */}
        {activeTrip && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <TrendingUp size={24} className="text-accent" />
              <h2 className="text-2xl font-black text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Contextual Discovery</h2>
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-border overflow-hidden shadow-xl shadow-navy/5 grid lg:grid-cols-5 min-h-[300px]">
              <div className="lg:col-span-2 bg-navy p-10 text-white flex flex-col justify-between">
                <div>
                   <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                      Active Trip Proximity
                   </div>
                   <h3 className="text-3xl font-black mb-2 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>{activeTrip.destination}</h3>
                   <p className="text-sm text-white/60 mb-8 font-medium italic">Explore the local staples near your current location.</p>
                </div>
                <Link to={`/trip/${activeTrip._id}`} className="bg-white text-navy px-6 py-4 rounded-2xl text-xs font-black no-underline text-center hover:bg-white/90 transition-all">
                   OPEN COMPASS VIEW
                </Link>
              </div>
              
              <div className="lg:col-span-3 p-8 lg:p-10">
                <div className="flex gap-6 border-b border-border mb-8 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'dining', label: 'Cuisine', icon: Utensils },
                    { id: 'sightseeing', label: 'Landmarks', icon: Landmark },
                    { id: 'accommodation', label: 'Budget Stays', icon: Building2 },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-4 px-1 text-xs font-black tracking-widest uppercase transition-all relative border-0 bg-transparent cursor-pointer flex items-center gap-2 whitespace-nowrap
                        ${activeTab === tab.id ? 'text-navy' : 'text-text-muted hover:text-navy'}
                      `}
                    >
                      <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                      {tab.label}
                      {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full" />}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Simplified cards for Explore page */}
                    {[1,2,3].map(i => (
                       <div key={i} className="bg-bg rounded-2xl p-6 border border-border hover:border-primary/50 transition-colors cursor-pointer group">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                             {activeTab === 'dining' ? <Utensils size={18} /> : activeTab === 'sightseeing' ? <Landmark size={18} /> : <Building2 size={18} />}
                          </div>
                          <p className="font-bold text-navy text-sm leading-tight mb-1">Local Favorite #{i}</p>
                          <p className="text-[11px] text-text-secondary line-clamp-2">A top-rated {activeTab} spot verified by our community in {activeTrip.destination}.</p>
                          <Link to={`/trip/${activeTrip._id}?tab=${activeTab}`} className="inline-flex items-center gap-1.5 text-[10px] font-black text-accent mt-6 no-underline uppercase tracking-widest">
                             View Details <ArrowRight size={12} />
                          </Link>
                       </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2 — DISCOVER NEW HORIZONS */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Compass size={24} className="text-primary" />
              <h2 className="text-2xl font-black text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>New Horizons</h2>
            </div>
            <div className="hidden sm:flex gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-accent" />
               <div className="w-2.5 h-2.5 rounded-full bg-border" />
               <div className="w-2.5 h-2.5 rounded-full bg-border" />
            </div>
          </div>

          <div className="space-y-12">
            {/* Popular Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {POPULAR_DESTINATIONS.map(dest => (
                <div key={dest.name} className="group relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-xl hover:-translate-y-2 transition-all duration-500">
                  <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute inset-x-0 bottom-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="inline-block px-2 py-0.5 bg-accent text-white text-[9px] font-bold rounded-full mb-2 uppercase tracking-widest">{dest.category}</span>
                    <p className="text-white font-black text-xl mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{dest.name}</p>
                    <p className="text-white/60 text-[10px] font-bold mb-4">Starting from {dest.budget}</p>
                    <button 
                      onClick={() => handlePlanTrip(dest.name)}
                      className="w-full py-3 bg-white text-navy hover:bg-accent hover:text-white rounded-xl text-[11px] font-black transition-all border-0 cursor-pointer shadow-lg"
                    >
                      PLAN TRIP
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Featured Seasonal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              {SEASONAL_HIGHLIGHTS.map(dest => (
                <div key={dest.name} className="relative rounded-[2.5rem] overflow-hidden h-80 shadow-2xl group cursor-pointer" onClick={() => handlePlanTrip(dest.name)}>
                  <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute inset-0 p-10 flex flex-col justify-end">
                    <div className="bg-white/95 backdrop-blur-md p-8 rounded-[2rem] transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-navy font-black text-2xl" style={{ fontFamily: "'Poppins', sans-serif" }}>{dest.name}</h4>
                        <div className="flex items-center gap-1.5 text-accent">
                          <Star size={18} fill="currentColor" />
                          <span className="text-sm font-black">{dest.rating}</span>
                        </div>
                      </div>
                      <p className="text-text-secondary text-sm mb-6 leading-relaxed font-medium">{dest.desc}</p>
                      <div className="flex items-center justify-between">
                         <span className="text-navy font-black text-lg">{dest.budget}</span>
                         <button className="bg-navy hover:bg-accent text-white px-8 py-3 rounded-2xl text-[11px] font-black transition-all border-0 shadow-lg shadow-navy/20">
                           BOOK ADVENTURE <ArrowRight size={14} className="inline ml-1" />
                         </button>
                      </div>
                    </div>
                    {/* Hover indicator for mobile/idle */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 group-hover:opacity-0 transition-opacity">
                       <span className="text-white text-[10px] font-black uppercase tracking-widest bg-navy/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">Hover to Preview</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3 — PAST LOCATIONS */}
        {pastTrips.length > 0 && (
          <section className="space-y-6 pt-12 border-t border-border">
            <div className="flex items-center gap-3">
              <Map size={24} className="text-text-muted" />
              <h2 className="text-xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Revisit Memories</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastTrips.map(trip => (
                <div key={trip._id} className="bg-white rounded-3xl p-8 border border-border shadow-sm group hover:border-accent hover:shadow-xl hover:shadow-accent/5 transition-all flex flex-col justify-between">
                  <div>
                     <h4 className="font-black text-navy text-xl mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{trip.destination}</h4>
                     <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6">Last visited {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/trip/${trip._id}`)}
                    className="w-full py-4 bg-bg text-navy hover:bg-navy hover:text-white rounded-2xl text-[11px] font-black tracking-widest transition-all border-0 cursor-pointer uppercase"
                  >
                    Explore Again
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="bg-navy py-12 px-8 text-center border-t border-white/5 mt-12">
          <p className="text-white/40 text-[11px] font-bold tracking-[0.3em] uppercase mb-4">WanderVault Experience</p>
          <p className="text-white/60 text-xs max-w-sm mx-auto font-medium leading-relaxed">Personalized discovery engine Powered by OpenStreetMap & WanderVault Intelligence.</p>
          <div className="mt-8 flex justify-center gap-6">
             <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
             <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
             <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
      </footer>
    </div>
  );
}
