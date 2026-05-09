import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { 
  Plane, Calendar, MapPin, 
  Trash2, Utensils, Compass, Hotel, X, 
  Briefcase, AlertTriangle,
  Share2, MessageCircle, Globe, Copy, Link2
} from 'lucide-react';
import { useToast } from '../components/Toast';
import ItineraryTab from '../pages/Itinerary';
import ConfirmModal from '../components/ConfirmModal';
import PromptModal from '../components/PromptModal';

import OverviewTab from '../components/TripTabs/OverviewTab';
import HotelsTab from '../components/TripTabs/HotelsTab';
import DiningTab from '../components/TripTabs/DiningTab';
import SightseeingTab from '../components/TripTabs/SightseeingTab';
import MapTab from '../components/TripTabs/MapTab';

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

  // Hotel search state
  const [hotelSearch, setHotelSearch] = useState('');
  const [hotelResults, setHotelResults] = useState([]);
  const [isSearchingHotels, setIsSearchingHotels] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'Food' });
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseErrors, setExpenseErrors] = useState({});
  const toast = useToast();

  // Share modal state (Area 5)
  const [showShareModal, setShowShareModal] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [hotelPromptTarget, setHotelPromptTarget] = useState(null);
  const [hotelConfirmTarget, setHotelConfirmTarget] = useState(null);

  const handleAddExpense = async (e) => {
    e.preventDefault();

    // Validation
    const errors = {};
    if (!expenseForm.title.trim()) errors.title = 'Please enter an expense title.';
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) errors.amount = 'Amount must be greater than zero.';
    if (Object.keys(errors).length > 0) {
      setExpenseErrors(errors);
      return;
    }
    setExpenseErrors({});

    setIsAddingExpense(true);
    try {
      await API.post(`/expenses/${id}`, {
        title: expenseForm.title.trim(),
        amount: Number(expenseForm.amount),
        category: expenseForm.category
      });
      toast.success(`"${expenseForm.title.trim()}" — ₹${Number(expenseForm.amount).toLocaleString()} added.`, 'Expense Added');
      setShowExpenseForm(false);
      setExpenseForm({ title: '', amount: '', category: 'Food' });
      fetchTrip();
    } catch {
      toast.error('Failed to add expense. Please try again.', 'Error');
    }
    setIsAddingExpense(false);
  };

  useEffect(() => {
    const handleHotelChange = (e) => setHotelConfirmTarget(e.detail);
    window.addEventListener('changeHotel', handleHotelChange);
    return () => window.removeEventListener('changeHotel', handleHotelChange);
  }, []);

  const fetchTrip = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/trips/${id}`);
      setTrip(data);
    } catch {
      setError('Failed to load trip details. It might have been deleted.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  useEffect(() => {
    if (queryTab && queryTab !== activeTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab, activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
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
    if (!hotelSearch.trim() || !trip?.latitude || !trip?.longitude) return;
    setIsSearchingHotels(true);
    try {
      const q = hotelSearch.toLowerCase();
      const query = `[out:json][timeout:25];
(
  node["tourism"="hotel"]["name"~"${q}", i](around:10000,${trip.latitude},${trip.longitude});
  node["tourism"="hostel"]["name"~"${q}", i](around:10000,${trip.latitude},${trip.longitude});
  node["tourism"="resort"]["name"~"${q}", i](around:10000,${trip.latitude},${trip.longitude});
  node["tourism"="guest_house"]["name"~"${q}", i](around:10000,${trip.latitude},${trip.longitude});
);
out body 5;`;

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`
      });
      if (!res.ok) throw new Error('OSM Error');
      const data = await res.json();
      
      let results = (data.elements || []).map(h => {
          const lat = h.lat;
          const lon = h.lon;
          const name = h.tags?.name;
          if (!name) return null;
          const seed = parseInt(String(h.id).slice(0,6)) || 0;
          return {
            id: String(h.id),
            name,
            address: h.tags?.['addr:street'] ? `${h.tags['addr:street']}, ${trip.destination}` : trip.destination,
            lat, lon,
            price: 800 + (seed % 4000),
            rating: (3.5 + (seed % 15) / 10).toFixed(1)
          };
      }).filter(h => h && h.name);
      
      // If Overpass exact name search fails or returns nothing, just do a generic search nearby
      if (results.length === 0) {
          const fbQuery = `[out:json][timeout:25];(node["tourism"="hotel"](around:5000,${trip.latitude},${trip.longitude}););out body 5;`;
          const fbRes = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(fbQuery)}`});
          const fbData = await fbRes.json();
          results = (fbData.elements || []).map(h => {
             const name = h.tags?.name || 'Local Hotel';
             const seed = parseInt(String(h.id).slice(0,6)) || 0;
             return {
                id: String(h.id), name, address: h.tags?.['addr:street'] ? `${h.tags['addr:street']}, ${trip.destination}` : trip.destination,
                lat: h.lat, lon: h.lon, price: 800 + (seed % 4000), rating: (3.5 + (seed % 15) / 10).toFixed(1)
             };
          }).filter(h => h && h.name && h.name.toLowerCase().includes(q));
      }
      
      setHotelResults(results);
    } catch (err) { console.error(err); }
    setIsSearchingHotels(false);
  };
  
  const getFsqCache = useCallback((type) => {
     if (!trip?.latitude) return [];
     const key = `wv_fsq_${type}_${trip.latitude}_${trip.longitude}`;
     try {
       const cached = localStorage.getItem(key);
       if (cached) return JSON.parse(cached).data || [];
     } catch {
       // Ignore cache errors
     }
     return [];
  }, [trip?.latitude, trip?.longitude]);
  
  const allNearbyPins = useMemo(() => {
     const dining = getFsqCache('dining').map(p => ({ ...p, pin_type: 'restaurant' }));
     const sights = getFsqCache('sightseeing').map(p => ({ ...p, pin_type: 'attraction' }));
     return [...dining, ...sights];
  }, [getFsqCache]);

  const confirmBookHotel = async (dayInput) => {
    const hotel = hotelPromptTarget;
    setHotelPromptTarget(null);
    if (!hotel || !dayInput) return;
    try {
      const day = Number(dayInput);
      if (!day || day < 1) return;
      await API.post(`/itinerary/${id}`, {
        day,
        title: `Stay: ${hotel.name}`,
        location: hotel.address,
        description: `Booking at ${hotel.name}. Coords: ${hotel.lat}, ${hotel.lon}`,
      });
      toast.success(`${hotel.name} added to Day ${day}.`, 'Hotel Booked');
      fetchTrip();
      setHotelResults([]);
      setHotelSearch('');
      setActiveTab('itinerary');
    } catch { 
      toast.error('Failed to save booking. Please try again.', 'Booking Error');
    }
  };

  const confirmRemoveHotel = async () => {
    const itineraryId = hotelConfirmTarget;
    setHotelConfirmTarget(null);
    if (!itineraryId) return;
    try {
      await API.delete(`/itinerary/${id}/${itineraryId}`);
      toast.success('Hotel removed from itinerary.', 'Hotel Removed');
      fetchTrip();
    } catch { 
      toast.error('Failed to remove hotel. Please try again.', 'Error');
    }
  };

  if (loading) return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
       <div className="h-48 bg-white rounded- animate-pulse" />
       <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-white rounded- animate-pulse" />)}
       </div>
       <div className="h-96 bg-white rounded- animate-pulse" />
    </div>
  );

  if (error || !trip) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
       <div className="w-20 h-20 bg-danger/10 text-danger rounded- flex items-center justify-center mb-6">
          <Trash2 size={40} />
       </div>
       <h2 className="text-2xl font-black text-navy mb-2">Trip Not Found</h2>
       <p className="text-text-secondary max-w-sm mb-8 break-words whitespace-normal px-6">{error || "This trip may have been removed or you don't have access."}</p>
       <button onClick={() => navigate('/dashboard')} className="bg-navy text-white px-8 py-6 rounded- font-bold border-0 cursor-pointer">Back to Dashboard</button>
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
                 <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-1 rounded- text-[10px] font-bold uppercase tracking-widest">
                    <Plane size={12} /> Travel Plan
                 </div>
                 <h1 className="text-4xl lg:text-5xl font-black text-navy leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {trip.name}
                 </h1>
                 <div className="flex flex-wrap items-center gap-4 text-text-secondary">
                    <div className="flex items-center gap-1.5 bg-bg px-6 py-1.5 rounded- border border-border">
                       <MapPin size={16} className="text-accent" />
                       <span className="text-sm font-bold text-navy">{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-bg px-6 py-1.5 rounded- border border-border">
                       <Calendar size={16} className="text-primary" />
                       <span className="text-sm font-bold text-navy">{new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}</span>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-navy rounded- p-6 text-white shadow-xl shadow-navy/20 min-w-[160px] relative">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Total Spent</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-2xl font-black">₹{trip.totalExpense?.toLocaleString()}</span>
                       <span className="text-[10px] text-white/60">/ ₹{trip.budget?.toLocaleString()}</span>
                    </div>
                 </div>
                  <button 
                    onClick={() => setShowExpenseForm(!showExpenseForm)}
                    className="bg-accent hover:bg-accent-dark text-white px-6 py-6 rounded- text-sm font-bold border-0 cursor-pointer shadow-lg shadow-accent/20 transition-all whitespace-nowrap"
                  >
                    {showExpenseForm ? '✕ Cancel' : '+ Add Expense'}
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="bg-bg border border-border text-navy px-6 py-6 rounded- text-sm font-bold cursor-pointer hover:bg-white transition-all flex items-center gap-2"
                  >
                    <Share2 size={16} /> Share
                  </button>
              </div>
           </div>
           
           {/* Add Expense Form Modal/Inline */}
           {showExpenseForm && (
              <div className="mt-6 bg-white p-6 rounded- border border-border shadow-lg animate-in fade-in slide-in-from-top-2">
                 <h4 className="font-bold text-navy mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Log an Expense</h4>
                 <form onSubmit={handleAddExpense} className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                       <label className="block text-xs font-bold text-navy mb-1">Title</label>
                       <input type="text" placeholder="e.g. Dinner at Seaside" className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-bg transition-colors ${expenseErrors.title ? 'border-danger' : 'border-border'}`} value={expenseForm.title} onChange={e => { setExpenseForm({...expenseForm, title: e.target.value}); if (expenseErrors.title) setExpenseErrors(prev => ({...prev, title: ''})); }} />
                       {expenseErrors.title && <p className="text-danger text-[10px] font-semibold mt-1">{expenseErrors.title}</p>}
                    </div>
                    <div className="w-32">
                       <label className="block text-xs font-bold text-navy mb-1">Amount (₹)</label>
                       <input type="number" min="1" placeholder="0" className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-bg transition-colors ${expenseErrors.amount ? 'border-danger' : 'border-border'}`} value={expenseForm.amount} onChange={e => { setExpenseForm({...expenseForm, amount: e.target.value}); if (expenseErrors.amount) setExpenseErrors(prev => ({...prev, amount: ''})); }} />
                       {expenseErrors.amount && <p className="text-danger text-[10px] font-semibold mt-1">{expenseErrors.amount}</p>}
                    </div>
                    <div className="w-40">
                       <label className="block text-xs font-bold text-navy mb-1">Category</label>
                       <select className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-bg" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                          <option value="Food">Food</option>
                          <option value="Transport">Transport</option>
                          <option value="Hotel">Hotel</option>
                          <option value="Activities">Activities</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Other">Other</option>
                       </select>
                    </div>
                    <button type="submit" disabled={isAddingExpense} className="bg-navy hover:bg-navy-dark text-white px-6 py-2.5 rounded-xl font-bold border-0 cursor-pointer h-[42px] min-w-[120px] transition-all">
                       {isAddingExpense ? 'Saving...' : 'Save Expense'}
                    </button>
                 </form>
              </div>
           )}
        </div>

        {/* ── Budget Alert ── */}
        {trip.totalExpense > trip.budget && (
           <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-6 mt-4">
              <div className="bg-danger/10 border-l-4 border-danger p-6 rounded-xl-r-xl flex items-center gap-3 shadow-sm">
                 <AlertTriangle size={24} className="text-danger shrink-0" />
                 <div>
                    <h4 className="text-sm font-bold text-danger uppercase tracking-wide">Warning: Budget Exceeded</h4>
                    <p className="text-sm text-danger/90 mt-0.5 font-medium">You have exceeded your budget by ₹{(trip.totalExpense - trip.budget).toLocaleString()}!</p>
                 </div>
              </div>
           </div>
        )}

        {/* ── Tabs Navigation ── */}
        <div className="relative max-w-7xl mx-auto">
           <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-20 md:hidden" />
           <div className="px-6 lg:px-8 overflow-x-auto no-scrollbar relative z-10">
              <div className="flex items-center gap-1">
              {TABS.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => handleTabChange(tab.id)}
                   className={`flex items-center gap-2 px-6 py-6 text-sm font-bold border-b-2 transition-all cursor-pointer bg-transparent whitespace-nowrap
                     ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-navy hover:border-border'}`}
                 >
                   <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                  </button>
               ))}
               </div>
            </div>
         </div>
      </div>

      {/* ── Tab Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8">
         <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
               <OverviewTab trip={trip} bookedHotel={bookedHotel} handleTabChange={handleTabChange} />
            )}

            {/* ITINERARY TAB */}
            {activeTab === 'itinerary' && (
               <ItineraryTab trip={trip} refreshTrip={fetchTrip} />
            )}

            {/* HOTELS TAB */}
            {activeTab === 'hotels' && (
               <HotelsTab trip={trip} hotelSearch={hotelSearch} setHotelSearch={setHotelSearch} searchHotels={searchHotels} isSearchingHotels={isSearchingHotels} hotelResults={hotelResults} setHotelPromptTarget={setHotelPromptTarget} />
            )}

            {/* DINING TAB */}
            {activeTab === 'dining' && (
               <DiningTab bookedHotel={bookedHotel} trip={trip} />
            )}

            {/* SIGHTSEEING TAB */}
            {activeTab === 'sightseeing' && (
               <SightseeingTab bookedHotel={bookedHotel} trip={trip} />
            )}

            {/* MAP TAB */}
            {activeTab === 'map' && (
               <MapTab trip={trip} allNearbyPins={allNearbyPins} />
            )}

         </div>
      </main>

      {/* ── Share Trip Modal (Area 5) ── */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-md p-6">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-border shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-navy flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <Share2 size={20} className="text-accent" /> Share Trip
              </h3>
              <button onClick={() => { setShowShareModal(false); setLinkCopied(false); }} className="w-8 h-8 bg-bg rounded-xl flex items-center justify-center text-text-muted hover:text-navy transition-colors border-0 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Public Toggle */}
            <div className="bg-bg rounded- p-6 border border-border mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${trip.isPublic ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">Make trip public</p>
                    <p className="text-[10px] text-text-muted">{trip.isPublic ? 'Anyone with the link can view' : 'Only you can see this trip'}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setTogglingVisibility(true);
                    try {
                      const { data } = await API.patch(`/trips/${id}/visibility`);
                      setTrip(data);
                    } catch (err) { console.error(err); }
                    setTogglingVisibility(false);
                  }}
                  disabled={togglingVisibility}
                  className={`relative w-12 h-7 rounded- transition-colors duration-200 border-0 cursor-pointer ${trip.isPublic ? 'bg-success' : 'bg-border'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded- shadow-md transition-transform duration-200 ${trip.isPublic ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {/* Share Link */}
            {trip.isPublic && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="bg-bg rounded- p-6 border border-border flex items-center gap-2">
                  <Link2 size={14} className="text-text-muted shrink-0" />
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/trip/public/${id}`}
                    className="flex-1 bg-transparent border-0 text-xs text-navy font-medium outline-none truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/trip/public/${id}`);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className={`shrink-0 flex items-center gap-1 px-6 py-1.5 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all ${linkCopied ? 'bg-success text-white' : 'bg-navy text-white hover:bg-navy-dark'}`}
                  >
                    <Copy size={12} /> {linkCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* WhatsApp Share (Feature B) */}
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/trip/public/${id}`;
                    const text = `Check out my trip to ${trip.destination}! ${url}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-6.5 rounded- text-sm font-bold text-white border-0 cursor-pointer transition-all hover:brightness-110"
                  style={{ backgroundColor: '#25D366', fontFamily: "'Inter', sans-serif" }}
                >
                  <MessageCircle size={16} /> Share on WhatsApp
                </button>
              </div>
            )}

            {!trip.isPublic && (
              <p className="text-xs text-text-muted text-center mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                Enable the toggle above to generate a shareable link.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {hotelPromptTarget && <PromptModal title={`Book ${hotelPromptTarget.name}`} message={`Which day are you checking into ${hotelPromptTarget.name}?`} defaultValue="1" onConfirm={confirmBookHotel} onCancel={() => setHotelPromptTarget(null)} />}
      {hotelConfirmTarget && <ConfirmModal title="Change hotel?" message="This will remove the current accommodation from your itinerary." onConfirm={confirmRemoveHotel} onCancel={() => setHotelConfirmTarget(null)} />}
    </div>
  );
}
