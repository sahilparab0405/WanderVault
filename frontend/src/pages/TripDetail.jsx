import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { 
  Plane, Calendar, MapPin, DollarSign, Wallet, MoreVertical, 
  Trash2, Plus, Info, ChevronRight, Utensils, Compass, Building,
  Navigation, CheckCircle, Clock, Hotel, ArrowRight, X, Search,
  Briefcase, Car, Train
} from 'lucide-react';
import { StatCardSkeleton, TripCardSkeleton } from '../components/Skeleton';
import ItineraryTab from '../pages/Itinerary';

// Lazy load heavy components
const TripMap = lazy(() => import('../components/TripMap'));
const DiningNearby = lazy(() => import('../components/DiningNearby'));
const SightseeingNearby = lazy(() => import('../components/SightseeingNearby'));

export default function TripDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Tab logic: respect URL query or state, default to 'overview'
  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || location.state?.tab || 'overview');
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visitedTabs, setVisitedTabs] = useState(new Set([activeTab]));

  // Hotel search state
  const [hotelSearch, setHotelSearch] = useState('');
  const [hotelResults, setHotelResults] = useState([]);
  const [isSearchingHotels, setIsSearchingHotels] = useState(false);

  useEffect(() => {
    fetchTrip();
  }, [id]);

  useEffect(() => {
    if (queryTab && queryTab !== activeTab) {
      setActiveTab(queryTab);
      setVisitedTabs(prev => new Set([...prev, queryTab]));
    }
  }, [queryTab]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/trips/${id}`);
      setTrip(data);
    } catch (err) {
      setError('Failed to load trip details. It might have been deleted.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setVisitedTabs(prev => new Set([...prev, tabId]));
    // Update URL without full refresh to keep track of tab
    const params = new URLSearchParams(location.search);
    params.set('tab', tabId);
    navigate({ search: params.toString() }, { replace: true });
  };

  // Find if there's a booked hotel in the itinerary
  const bookedHotel = useMemo(() => {
    if (!trip?.itinerary) return null;
    return trip.itinerary.find(item => item.title.toLowerCase().includes('stay:') || item.title.toLowerCase().includes('hotel:'));
  }, [trip]);

  const searchHotels = async () => {
    if (!hotelSearch.trim()) return;
    setIsSearchingHotels(true);
    try {
      const q = encodeURIComponent(`${hotelSearch} in ${trip.destination}`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1`);
      const data = await res.json();
      setHotelResults(data.map(h => {
          const lat = parseFloat(h.lat);
          const lon = parseFloat(h.lon);
          // Deterministic price/rating based on ID
          const seed = parseInt(h.place_id) || 0;
          return {
            id: h.place_id,
            name: h.display_name.split(',')[0],
            address: h.display_name,
            lat, lon,
            price: 800 + (seed % 4000),
            rating: (3.5 + (seed % 15) / 10).toFixed(1)
          };
      }));
    } catch (err) { console.error(err); }
    setIsSearchingHotels(false);
  };

  const bookHotel = async (hotel) => {
    try {
      const dayInput = window.prompt(`Which day are you checking into ${hotel.name}?`, '1');
      if (!dayInput) return;
      const day = parseInt(dayInput, 10);
      
      await API.post(`/itinerary/${id}`, {
        day,
        title: `Stay: ${hotel.name}`,
        location: hotel.address,
        description: `Booking at ${hotel.name}. Coords: ${hotel.lat}, ${hotel.lon}`,
      });
      
      fetchTrip();
      setHotelResults([]);
      setHotelSearch('');
      setActiveTab('itinerary');
    } catch (err) { alert('Failed to save booking.'); }
  };

  const removeHotel = async (itineraryId) => {
    if (!window.confirm('Change hotel? This will remove the current accommodation from your itinerary.')) return;
    try {
      await API.delete(`/itinerary/${id}/${itineraryId}`);
      fetchTrip();
    } catch (err) { alert('Failed to remove hotel.'); }
  };

  if (loading) return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
       <div className="h-48 bg-white rounded-3xl animate-pulse" />
       <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-white rounded-xl animate-pulse" />)}
       </div>
       <div className="h-96 bg-white rounded-3xl animate-pulse" />
    </div>
  );

  if (error || !trip) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
       <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6">
          <Trash2 size={40} />
       </div>
       <h2 className="text-2xl font-black text-navy mb-2">Trip Not Found</h2>
       <p className="text-text-secondary max-w-sm mb-8">{error || 'This trip may have been removed or you don\\'t have access.'}</p>
       <button onClick={() => navigate('/dashboard')} className="bg-navy text-white px-8 py-3 rounded-xl font-bold border-0 cursor-pointer">Back to Dashboard</button>
    </div>
  );

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
    { id: 'hotels', label: 'Hotel Search', icon: Hotel },
    { id: 'dining', label: 'Dining', icon: Utensils },
    { id: 'sightseeing', label: 'Sightseeing', icon: Compass },
    { id: 'map', label: 'Trip Map', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      
      {/* ── Trip Header ── */}
      <div className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-10 lg:px-8">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                 <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <Plane size={12} /> Travel Plan
                 </div>
                 <h1 className="text-4xl lg:text-5xl font-black text-navy leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {trip.name}
                 </h1>
                 <div className="flex flex-wrap items-center gap-4 text-text-secondary">
                    <div className="flex items-center gap-1.5 bg-bg px-3 py-1.5 rounded-xl border border-border">
                       <MapPin size={16} className="text-accent" />
                       <span className="text-sm font-bold text-navy">{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-bg px-3 py-1.5 rounded-xl border border-border">
                       <Calendar size={16} className="text-primary" />
                       <span className="text-sm font-bold text-navy">{new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}</span>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-navy rounded-2xl p-4 text-white shadow-xl shadow-navy/20 min-w-[160px]">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Total Spent</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-2xl font-black">₹{trip.totalExpense?.toLocaleString()}</span>
                       <span className="text-[10px] text-white/60">/ ₹{trip.budget?.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 overflow-x-auto no-scrollbar">
           <div className="flex items-center gap-1">
              {TABS.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => handleTabChange(tab.id)}
                   className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all cursor-pointer bg-transparent whitespace-nowrap
                     ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-navy hover:border-border'}`}
                 >
                   <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                   {tab.label}
                 </button>
              ))}
           </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8">
         <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-8">
                    {/* Key Highlights Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-border shadow-sm">
                       <h3 className="text-xl font-black text-navy mb-8 flex items-center gap-2">
                          <Info size={24} className="text-primary" /> Trip Essentials
                       </h3>
                       <div className="grid sm:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Transport Status</p>
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                                   <Car size={24} />
                                </div>
                                <div>
                                   <p className="font-black text-navy text-lg">Local Transit</p>
                                   <p className="text-[11px] text-text-secondary">Self-commute mode active</p>
                                </div>
                             </div>
                          </div>
                          <div className="space-y-3">
                             <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Accommodation</p>
                             <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${bookedHotel ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-600'} rounded-2xl flex items-center justify-center shadow-inner`}>
                                   <Hotel size={24} />
                                </div>
                                <div>
                                   <p className="font-black text-navy text-lg">{bookedHotel ? 'Stay Blocked' : 'Not Reserved'}</p>
                                   <p className="text-[11px] text-text-secondary">{bookedHotel ? 'Booking found in itinerary' : 'Find stays in hotel tab'}</p>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="mt-10 pt-10 border-t border-border flex flex-col sm:flex-row gap-4">
                          <button onClick={() => handleTabChange('itinerary')} className="flex-1 bg-navy text-white py-5 rounded-[1.25rem] font-black flex items-center justify-center gap-3 hover:bg-navy-dark transition-all border-0 cursor-pointer shadow-lg shadow-navy/20">
                             VIEW DAILY ITINERARY <ArrowRight size={18} />
                          </button>
                          <button onClick={() => handleTabChange('map')} className="flex-1 bg-bg border border-border text-navy py-5 rounded-[1.25rem] font-black flex items-center justify-center gap-3 hover:bg-white transition-all border-0 cursor-pointer">
                             OPEN INTERACTIVE MAP <MapPin size={18} />
                          </button>
                       </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid sm:grid-cols-3 gap-6">
                       <div className="bg-white p-8 rounded-[2rem] border border-border shadow-sm text-center group hover:border-primary/50 transition-colors">
                          <div className="w-14 h-14 bg-accent/10 text-accent rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                             <Clock size={28} />
                          </div>
                          <p className="text-2xl font-black text-navy">{Math.ceil((new Date(trip.endDate) - new Date(trip.startDate))/(1000*60*60*24))} Days</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Duration</p>
                       </div>
                       <div className="bg-white p-8 rounded-[2rem] border border-border shadow-sm text-center group hover:border-success/50 transition-colors">
                          <div className="w-14 h-14 bg-success/10 text-success rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                             <DollarSign size={28} />
                          </div>
                          <p className="text-2xl font-black text-navy">₹{Math.round(trip.totalExpense / Math.ceil((new Date(trip.endDate) - new Date(trip.startDate))/(1000*60*60*24)) || 1)}</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Daily Avg</p>
                       </div>
                       <div className="bg-white p-8 rounded-[2rem] border border-border shadow-sm text-center group hover:border-primary/50 transition-colors">
                          <div className="w-14 h-14 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                             <Building size={28} />
                          </div>
                          <p className="text-2xl font-black text-navy">{trip.itinerary?.length || 0}</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Activities</p>
                       </div>
                    </div>
                 </div>

                 {/* Sidebar Col: Active Hotel + Map Preview */}
                 <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] overflow-hidden border border-border shadow-sm">
                       <div className="p-6 border-b border-border bg-bg/50">
                          <h4 className="font-bold text-navy flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                             <Hotel size={14} className="text-accent" /> Booked Stay
                          </h4>
                       </div>
                       <div className="p-8">
                          {bookedHotel ? (
                             <div className="space-y-6">
                                <div>
                                   <p className="text-xl font-black text-navy leading-tight">{bookedHotel.title.replace('Stay: ', '').replace('Hotel: ', '')}</p>
                                   <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
                                      <MapPin size={12} className="text-accent" /> {bookedHotel.location || trip.destination}
                                   </p>
                                </div>
                                <div className="pt-4 flex gap-3">
                                   <button 
                                      onClick={() => removeHotel(bookedHotel._id)}
                                      className="flex-1 bg-danger/5 hover:bg-danger text-danger hover:text-white py-3 rounded-xl text-xs font-black transition-all border-0 cursor-pointer"
                                   >
                                      Change Hotel
                                   </button>
                                   <a href={`https://www.google.com/maps/search/?api=1&query=${bookedHotel.title}`} target="_blank" className="flex-1 bg-bg text-navy py-3 rounded-xl text-xs font-black text-center no-underline border border-border hover:bg-white transition-all">
                                      Directions
                                   </a>
                                </div>
                             </div>
                          ) : (
                             <div className="text-center py-6 space-y-6">
                                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                                   <AlertTriangle size={32} />
                                </div>
                                <div>
                                   <p className="font-bold text-navy">No Hotel Found</p>
                                   <p className="text-[11px] text-text-muted mt-1 leading-relaxed">You haven't added a hotel for this trip yet.</p>
                                </div>
                                <button onClick={() => handleTabChange('hotels')} className="w-full bg-accent text-white py-3.5 rounded-2xl text-xs font-black border-0 cursor-pointer shadow-lg shadow-accent/20">Find Budget Stays</button>
                             </div>
                          )}
                       </div>
                    </div>

                    <div className="bg-navy rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-navy/40">
                       <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
                       <div className="relative z-10">
                          <Compass size={48} className="mb-6 text-accent" />
                          <h4 className="text-2xl font-black mb-3">Around Your Stay</h4>
                          <p className="text-sm text-white/70 mb-8 font-medium leading-relaxed">Find the best dining and spots near your booked hotel for convenience.</p>
                          <div className="grid gap-3">
                             <button onClick={() => handleTabChange('dining')} className="w-full bg-white text-navy py-4 rounded-xl text-xs font-black border-0 cursor-pointer hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                                <Utensils size={14} /> NEARBY FOOD
                             </button>
                             <button onClick={() => handleTabChange('sightseeing')} className="w-full bg-white/10 text-white py-4 rounded-xl text-xs font-black border border-white/20 cursor-pointer hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                <Compass size={14} /> EXPLORE AREA
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* ITINERARY TAB */}
            {activeTab === 'itinerary' && (
               <ItineraryTab trip={trip} refreshTrip={fetchTrip} />
            )}

            {/* HOTELS TAB */}
            {activeTab === 'hotels' && (
               <div className="space-y-8 max-w-5xl mx-auto">
                  <div className="bg-white rounded-[2.5rem] p-8 lg:p-14 border border-border shadow-xl">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                        <div>
                           <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                              <Building size={12} /> Budget Accommodations
                           </div>
                           <h2 className="text-4xl font-black text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Find Your Stay</h2>
                           <p className="text-text-secondary text-lg">Search and book verified budget hotels in {trip.destination}.</p>
                        </div>
                        <div className="flex gap-3 bg-bg p-2 rounded-2xl border border-border w-full md:w-auto">
                           <input 
                              type="text" 
                              placeholder="Search hotel name..."
                              value={hotelSearch}
                              onChange={e => setHotelSearch(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && searchHotels()}
                              className="px-6 py-4 rounded-xl border border-border bg-white text-sm focus:ring-4 focus:ring-primary/10 transition-all w-full md:w-72"
                           />
                           <button 
                              onClick={searchHotels}
                              disabled={isSearchingHotels}
                              className="bg-navy text-white px-6 py-4 rounded-xl hover:bg-navy-dark transition-all border-0 cursor-pointer shrink-0 shadow-lg shadow-navy/20"
                           >
                              {isSearchingHotels ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block"></span> : <Search size={20} />}
                           </button>
                        </div>
                     </div>

                     {hotelResults.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-8">
                           {hotelResults.map(hotel => (
                              <div key={hotel.id} className="group bg-bg rounded-[2.5rem] p-8 border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                                 <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                       <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                          <Building size={32} />
                                       </div>
                                       <div className="text-right">
                                          <p className="text-2xl font-black text-navy">₹{hotel.price.toLocaleString()}</p>
                                          <p className="text-[10px] font-bold text-text-muted uppercase">per night</p>
                                       </div>
                                    </div>
                                    <h4 className="font-bold text-navy text-xl leading-tight mb-2 line-clamp-1">{hotel.name}</h4>
                                    <p className="text-xs text-text-muted flex items-center gap-1 mb-8">
                                       <MapPin size={12} className="text-accent" /> {hotel.address.split(',').slice(0, 3).join(',')}
                                    </p>
                                    <div className="flex items-center gap-4 mb-8">
                                       <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-border text-[11px] font-bold text-navy">
                                          <Star size={12} fill="#F59E0B" className="text-amber-500" /> {hotel.rating}
                                       </div>
                                       <div className="text-[11px] font-bold text-success uppercase tracking-widest">Available Now</div>
                                    </div>
                                    <button onClick={() => bookHotel(hotel)} className="w-full bg-navy text-white py-5 rounded-[1.25rem] text-sm font-black transition-all border-0 cursor-pointer shadow-lg shadow-navy/20 active:scale-95">
                                       BOOK THIS STAY
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center py-20 bg-bg rounded-[2.5rem] border-2 border-dashed border-border">
                           <Search size={64} className="text-text-muted/30 mx-auto mb-6" />
                           <h3 className="text-2xl font-black text-navy mb-2">Start Your Search</h3>
                           <p className="text-text-secondary max-w-xs mx-auto">Enter a hotel name or keyword to find the best budget stays in {trip.destination}.</p>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* DINING TAB */}
            {activeTab === 'dining' && (
               <div className="max-w-5xl mx-auto space-y-8">
                  <div className="bg-white rounded-[2.5rem] p-8 lg:p-14 border border-border shadow-xl">
                     <div className="mb-12">
                        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                           <Utensils size={12} /> Local Gastronomy
                        </div>
                        <h2 className="text-4xl font-black text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Nearby Dining</h2>
                        <p className="text-text-secondary text-lg">Taste the local flavors! Verified eateries near {bookedHotel ? 'your booked hotel' : trip.destination}.</p>
                     </div>
                     <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-12 w-64 bg-border rounded-xl" /><div className="h-80 bg-border rounded-[2rem]" /></div>}>
                        <DiningNearby 
                           latitude={bookedHotel?.lat || trip.latitude} 
                           longitude={bookedHotel?.lon || trip.longitude} 
                        />
                     </Suspense>
                  </div>
               </div>
            )}

            {/* SIGHTSEEING TAB */}
            {activeTab === 'sightseeing' && (
               <div className="max-w-5xl mx-auto space-y-8">
                  <div className="bg-white rounded-[2.5rem] p-8 lg:p-14 border border-border shadow-xl">
                     <div className="mb-12">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                           <Compass size={12} /> Local Wonders
                        </div>
                        <h2 className="text-4xl font-black text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Discover the Area</h2>
                        <p className="text-text-secondary text-lg">Must-visit spots and cultural landmarks near {bookedHotel ? 'your stay' : 'your destination'}.</p>
                     </div>
                     <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-12 w-64 bg-border rounded-xl" /><div className="h-80 bg-border rounded-[2rem]" /></div>}>
                        <SightseeingNearby 
                           latitude={bookedHotel?.lat || trip.latitude} 
                           longitude={bookedHotel?.lon || trip.longitude} 
                        />
                     </Suspense>
                  </div>
               </div>
            )}

            {/* MAP TAB */}
            {activeTab === 'map' && (
               <div className="max-w-6xl mx-auto space-y-8 h-[75vh]">
                  <div className="bg-white rounded-[3rem] overflow-hidden border border-border shadow-2xl h-full relative">
                     <Suspense fallback={<div className="h-full w-full bg-border/20 animate-pulse flex items-center justify-center text-text-muted text-sm font-bold">CALIBRATING GPS SATELLITES...</div>}>
                        <TripMap 
                           latitude={trip.latitude} 
                           longitude={trip.longitude} 
                           destination={trip.destination} 
                        />
                     </Suspense>
                  </div>
               </div>
            )}

         </div>
      </main>
    </div>
  );
}
