import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { 
  Compass, Utensils, MapPin, Building2,
  ArrowRight, Star, Search,
  TrendingUp, Landmark, Map, Calendar
} from 'lucide-react';

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
    budget: '₹12,000 - ₹20,000', 
    days: '3-4 days',
    tag: 'Hills',
    description: 'Queen of Hills',
    gradientFrom: '#94a3b8', // slate-400
    gradientTo: '#93c5fd',   // blue-300
    rating: 4.8
  },
  { 
    name: 'Pondicherry', 
    budget: '₹10,000 - ₹18,000', 
    days: '3-4 days',
    tag: 'Coastal',
    description: 'French Riviera of India',
    gradientFrom: '#2dd4bf', // teal-400
    gradientTo: '#67e8f9',   // cyan-300
    rating: 4.7
  },
];

/* ── Contextual Discovery place names ── */
const PLACE_NAMES = {
  dining: [
    { name: 'Popular Local Restaurant', desc: 'Authentic regional cuisine with top ratings from travelers.' },
    { name: 'Cozy Cafe & Bakery', desc: 'Fresh pastries and artisan coffee in a charming setting.' },
    { name: 'Street Food Corner', desc: 'Quick bites and local delicacies loved by the community.' },
  ],
  sightseeing: [
    { name: 'Heritage Monument', desc: 'Historical landmark with rich cultural significance.' },
    { name: 'Scenic Viewpoint', desc: 'Panoramic views of the surrounding landscape.' },
    { name: 'Local Museum', desc: 'Curated exhibits showcasing regional art and history.' },
  ],
  accommodation: [
    { name: 'Budget Stays Nearby', desc: 'Affordable and comfortable options close to major attractions.' },
    { name: 'Boutique Guesthouse', desc: 'Unique stay with personalized hospitality.' },
    { name: 'Hotel Near Center', desc: 'Centrally located with easy access to dining and sights.' },
  ],
};

export default function Explore() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dining');
  const navigate = useNavigate();

  const fetchTrips = useCallback(async () => {
    try {
      const { data } = await API.get('/trips');
      setTrips(data);
    } catch (err) {
      console.error('Failed to fetch trips', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const activeTrip = useMemo(() => {
    return trips.find(t => {
      const now = new Date();
      return new Date(t.startDate) <= now && new Date(t.endDate) >= now;
    }) || trips[0];
  }, [trips]);

  const pastTrips = useMemo(() => trips.filter(t => new Date(t.endDate) < new Date()).slice(0, 3), [trips]);

  const handlePlanTrip = (destination) => {
    navigate('/create-trip', { state: { prefillDestination: destination } });
  };

  if (loading) return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-10 w-48 bg-border/40 rounded-xl animate-pulse" />
        <div className="h-80 bg-white rounded-3xl animate-pulse border border-border" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-white rounded- animate-pulse" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      
      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-border px-8 py-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
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
                className="pl-9 pr-6 py-2 bg-bg border border-border rounded- text-xs w-48 focus:w-64 focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none"
              />
           </div>
           <Link to="/create-trip" className="bg-accent hover:bg-accent-dark text-white px-6 py-2.5 rounded- text-xs font-bold no-underline transition-all shadow-lg shadow-accent/20">
              New Trip
           </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8 space-y-12 animate-in fade-in duration-700">
        
        {/* SECTION 1 — ACTIVE TRIP CONTEXT */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-accent" />
            <h2 className="text-2xl font-black text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Contextual Discovery</h2>
          </div>
          
          <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-xl shadow-navy/5 grid lg:grid-cols-5 min-h-[300px]">
            <div className="lg:col-span-2 bg-navy p-10 text-white flex flex-col justify-between">
              {activeTrip ? (
                <div>
                   <div className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-1 rounded- text-[10px] font-bold uppercase tracking-widest mb-4">
                      Active Trip Proximity
                   </div>
                   <h3 className="text-3xl font-black mb-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>{activeTrip.name}</h3>
                   <div className="flex items-center gap-2 mb-2 text-white/80">
                     <MapPin size={14} className="text-accent shrink-0" />
                     <span className="text-sm font-medium">{activeTrip.destination}</span>
                   </div>
                   <div className="flex items-center gap-2 text-white/60">
                     <Calendar size={14} className="shrink-0" />
                     <span className="text-xs font-medium">{new Date(activeTrip.startDate).toLocaleDateString()} — {new Date(activeTrip.endDate).toLocaleDateString()}</span>
                   </div>
                </div>
              ) : (
                <div>
                   <div className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-1 rounded- text-[10px] font-bold uppercase tracking-widest mb-4">
                      Discovery
                   </div>
                   <h3 className="text-2xl font-black mb-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>No Trip Yet</h3>
                   <p className="text-sm text-white/60 mb-6 font-medium">Create a trip to see nearby recommendations</p>
                </div>
              )}
              {activeTrip ? (
                <Link to={`/trip/${activeTrip._id}`} className="bg-white text-navy px-6 py-6 rounded- text-xs font-black no-underline text-center hover:bg-white/90 transition-all mt-6">
                   VIEW TRIP DETAILS
                </Link>
              ) : (
                <Link to="/create-trip" className="bg-accent text-white px-6 py-6 rounded- text-xs font-black no-underline text-center hover:bg-accent-dark transition-all mt-6">
                   CREATE FIRST TRIP
                </Link>
              )}
            </div>
            
            <div className="lg:col-span-3 p-8 lg:p-10 relative">
              <div className="absolute right-8 top-8 bottom-8 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-20 md:hidden" />
              <div className="flex gap-6 border-b border-border mb-8 overflow-x-auto no-scrollbar relative z-10">
                {[
                  { id: 'dining', label: 'Cuisine', icon: Utensils },
                  { id: 'sightseeing', label: 'Landmarks', icon: Landmark },
                  { id: 'accommodation', label: 'Budget Stays', icon: Building2 },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-6 px-1 text-xs font-black tracking-widest uppercase transition-all relative border-0 bg-transparent cursor-pointer flex items-center gap-2 whitespace-nowrap
                      ${activeTab === tab.id ? 'text-navy' : 'text-text-muted hover:text-navy'}
                    `}
                  >
                    <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                    {tab.label}
                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-" />}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {PLACE_NAMES[activeTab].map((item, i) => (
                     <div key={i} className="bg-bg rounded- p-6 border border-border hover:border-primary/50 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 bg-white rounded- flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                           {activeTab === 'dining' ? <Utensils size={18} /> : activeTab === 'sightseeing' ? <Landmark size={18} /> : <Building2 size={18} />}
                        </div>
                        <p className="font-bold text-navy text-sm leading-tight mb-1">{item.name}</p>
                        <p className="text-[11px] text-text-secondary line-clamp-2">{item.desc}</p>
                        {activeTrip ? (
                          <Link to={`/trip/${activeTrip._id}?tab=${activeTab}`} className="inline-flex items-center gap-1.5 text-[10px] font-black text-accent mt-6 no-underline uppercase tracking-widest">
                             View Details <ArrowRight size={12} />
                          </Link>
                        ) : (
                          <Link to="/create-trip" className="inline-flex items-center gap-1.5 text-[10px] font-black text-accent mt-6 no-underline uppercase tracking-widest">
                             Create Trip <ArrowRight size={12} />
                          </Link>
                        )}
                     </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — DISCOVER NEW HORIZONS */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Compass size={24} className="text-primary" />
              <h2 className="text-2xl font-black text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>New Horizons</h2>
            </div>
            <div className="hidden sm:flex gap-2">
               <div className="w-2.5 h-2.5 rounded- bg-accent" />
               <div className="w-2.5 h-2.5 rounded- bg-border" />
               <div className="w-2.5 h-2.5 rounded- bg-border" />
            </div>
          </div>

          <div className="space-y-12">
            {/* Popular Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {POPULAR_DESTINATIONS.map(dest => (
                <div key={dest.name} className="group relative rounded-3xl overflow-hidden aspect-[4/5] shadow-xl hover:-translate-y-2 transition-all duration-500">
                  <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute inset-x-0 bottom-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="inline-block px-2 py-0.5 bg-accent text-white text-[9px] font-bold rounded- mb-2 uppercase tracking-widest">{dest.category}</span>
                    <p className="text-white font-black text-xl mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{dest.name}</p>
                    <p className="text-white/60 text-[10px] font-bold mb-4">Starting from {dest.budget}</p>
                    <button 
                      onClick={() => handlePlanTrip(dest.name)}
                      className="w-full py-6 bg-white text-navy hover:bg-accent hover:text-white rounded- text-[11px] font-black transition-all border-0 cursor-pointer shadow-lg"
                    >
                      PLAN TRIP
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Featured Seasonal — Shimla + Pondicherry with CSS gradient backgrounds */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
              {SEASONAL_HIGHLIGHTS.map(dest => (
                <div key={dest.name} className="relative rounded-3xl overflow-hidden h-80 shadow-2xl group cursor-pointer" onClick={() => handlePlanTrip(dest.name)}>
                  {/* CSS Gradient Background instead of broken image */}
                  <div 
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${dest.gradientFrom}, ${dest.gradientTo})` }}
                  />
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded- -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded- -ml-24 -mb-24 group-hover:scale-125 transition-transform duration-700" />
                  
                  {/* Always visible content — no hover-to-preview */}
                  <div className="absolute inset-0 p-8 lg:p-10 flex flex-col justify-between relative z-10">
                    <div>
                      <span className="inline-block px-6 py-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold rounded- uppercase tracking-widest border border-white/20">
                        {dest.tag}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-white/70 text-xs font-bold mb-1">{dest.description}</p>
                          <h4 className="text-white font-black text-3xl mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>{dest.name}</h4>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-1.5 text-white/90">
                              <Star size={14} fill="currentColor" />
                              <span className="text-sm font-black">{dest.rating}</span>
                            </div>
                            <span className="text-white/60 text-xs font-bold">{dest.days}</span>
                          </div>
                          <p className="text-white font-black text-lg">{dest.budget}</p>
                        </div>
                        <button className="bg-white text-navy hover:bg-accent hover:text-white px-6 py-6 rounded- text-[11px] font-black transition-all border-0 shadow-lg shadow-black/10 cursor-pointer">
                          PLAN TRIP <ArrowRight size={14} className="inline ml-1" />
                        </button>
                      </div>
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
                <div key={trip._id} className="bg-white rounded- p-8 border border-border shadow-sm group hover:border-accent hover:shadow-xl hover:shadow-accent/5 transition-all flex flex-col justify-between">
                  <div>
                     <h4 className="font-black text-navy text-xl mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{trip.destination}</h4>
                     <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6">Last visited {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/trip/${trip._id}`)}
                    className="w-full py-6 bg-bg text-navy hover:bg-navy hover:text-white rounded- text-[11px] font-black tracking-widest transition-all border-0 cursor-pointer uppercase"
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
             <div className="w-1.5 h-1.5 rounded- bg-white/20" />
             <div className="w-1.5 h-1.5 rounded- bg-white/20" />
             <div className="w-1.5 h-1.5 rounded- bg-white/20" />
          </div>
      </footer>
    </div>
  );
}
