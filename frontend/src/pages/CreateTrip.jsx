import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import DatePicker from 'react-datepicker';
import BudgetScoreCard from '../components/BudgetScoreCard';
import STARTER_ITINERARIES from '../data/starterItineraries';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Pen, MapPin, Navigation, Calendar, Building2,
  Wallet, Plane, Train, Bus, Car, Search, AlertTriangle, ExternalLink,
  ChevronDown, ChevronUp, X, Wifi, Bath, Flame, ParkingCircle, Star,
  Sparkles, CheckCircle2
} from 'lucide-react';
import { useToast } from '../components/Toast';
import {
  CheckCircleIcon,
  Step1TripName,
  Step2Destination,
  Step3TravelMode,
  Step4Dates,
  Step5Accommodation,
  Step6Budget
} from '../components/WizardSteps/Steps';

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */
const STEPS = [
  { number: 1, label: 'Trip Name',     Icon: Pen },
  { number: 2, label: 'Destination',   Icon: MapPin },
  { number: 3, label: 'Travel Mode',   Icon: Navigation },
  { number: 4, label: 'Dates',         Icon: Calendar },
  { number: 5, label: 'Accommodation', Icon: Building2 }, // NEW
  { number: 6, label: 'Budget',        Icon: Wallet },
];

const TRAVEL_MODES = [
  { id: 'flight', label: 'Flight', Icon: Plane },
  { id: 'train',  label: 'Train',  Icon: Train },
  { id: 'bus',    label: 'Bus',    Icon: Bus   },
  { id: 'car',    label: 'Car',    Icon: Car   },
];

const BOOKING_CONFIG = {
  flight: {
    links: [
      { label: 'MakeMyTrip', url: 'https://www.makemytrip.com/flights/' },
      { label: 'Goibibo',    url: 'https://www.goibibo.com/flights/' },
      { label: 'Cleartrip',  url: 'https://www.cleartrip.com/flights/' },
    ],
    fields: [
      { key: 'airline',  label: 'Airline Name',   placeholder: 'e.g. IndiGo',  required: true },
      { key: 'flightNo', label: 'Flight Number',  placeholder: 'e.g. 6E 2341', required: false },
      { key: 'depTime',  label: 'Departure Time', placeholder: 'hh:mm', type: 'time' },
      { key: 'arrTime',  label: 'Arrival Time',   placeholder: 'hh:mm', type: 'time' },
    ],
  },
  train: {
    links: [{ label: 'IRCTC', url: 'https://www.irctc.co.in/' }],
    fields: [
      { key: 'trainName', label: 'Train Name',     placeholder: 'e.g. Rajdhani Express', required: true },
      { key: 'pnr',       label: 'PNR Number',     placeholder: 'e.g. 1234567890' },
      { key: 'depTime',   label: 'Departure Time', placeholder: 'hh:mm', type: 'time' },
      { key: 'arrTime',   label: 'Arrival Time',   placeholder: 'hh:mm', type: 'time' },
    ],
  },
  bus: {
    links: [{ label: 'RedBus', url: 'https://www.redbus.in/' }],
    fields: [
      { key: 'operator', label: 'Bus Operator',   placeholder: 'e.g. VRL Travels', required: true },
      { key: 'ticketNo', label: 'Ticket Number',  placeholder: 'e.g. RB123456' },
      { key: 'depTime',  label: 'Departure Time', placeholder: 'hh:mm', type: 'time' },
      { key: 'arrTime',  label: 'Arrival Time',   placeholder: 'hh:mm', type: 'time' },
    ],
  },
  car: {
    links: [],
    fields: [{ key: 'depTime', label: 'Planned Departure', placeholder: 'hh:mm', type: 'time' }],
  },
};

/* ══════════════════════════════════════════════════════
   CACHE UTILS
══════════════════════════════════════════════════════ */
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

function getCachedData(key) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  const parsed = JSON.parse(cached);
  if (Date.now() - parsed.ts > CACHE_TTL) {
    localStorage.removeItem(key);
    return null;
  }
  return parsed.data;
}

function setCachedData(key, data) {
  localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
}

/* ══════════════════════════════════════════════════════
   LOCATION SEARCH HOOK
══════════════════════════════════════════════════════ */
function useLocationSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback((value) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) { setSuggestions([]); setIsSearching(false); return; }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const cacheKey = 'wv_loc_' + value.trim().toLowerCase();
      const cached = getCachedData(cacheKey);
      if (cached) { setSuggestions(cached); setIsSearching(false); return; }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value.trim())}&limit=6&addressdetails=1`, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        const results = data.map(item => ({
          displayName: item.display_name,
          name: item.name || item.display_name.split(',')[0],
          city: item.address?.city || item.address?.town || item.address?.village || item.name || '',
          country: item.address?.country || '',
          lat: parseFloat(item.lat), lon: parseFloat(item.lon),
        }));
        setSuggestions(results);
        setCachedData(cacheKey, results);
      } catch { setSuggestions([]); }
      setIsSearching(false);
    }, 300);
  }, []);

  const clear = useCallback(() => { setQuery(''); setSuggestions([]); setIsSearching(false); }, []);
  return { query, setQuery, suggestions, setSuggestions, isSearching, search, clear };
}

/* ══════════════════════════════════════════════════════
   HOTEL SEARCH HOOK
══════════════════════════════════════════════════════ */
function useHotelSearch(destination, lat, lon) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!destination || !lat || !lon) return;
    const fetchHotels = async () => {
      setLoading(true);
      const cacheKey = 'wv_osm_hotels_' + destination.toLowerCase();
      const cached = getCachedData(cacheKey);
      if (cached) { setHotels(cached); setLoading(false); return; }
      try {
        const query = `[out:json][timeout:25];
(
  node["tourism"="hotel"](around:5000,${lat},${lon});
  node["tourism"="hostel"](around:5000,${lat},${lon});
  node["tourism"="guest_house"](around:5000,${lat},${lon});
  node["tourism"="resort"](around:5000,${lat},${lon});
);
out body 10;`;

        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`
        });

        if (!res.ok) throw new Error('OSM Error');
        const data = await res.json();
        const results = (data.elements || []).map(item => {
          const name = item.tags?.name;
          if (!name) return null;
          
          const hash = String(item.id).split('').reduce((a,c)=>a+c.charCodeAt(0),0) + name.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
          const priceTier = (1 + (hash % 3)); 
          const price = Math.round((800 + (hash % 4700)) / 50) * 50 * priceTier;
          const rating = (3.5 + ((hash % 15) / 10)).toFixed(1);
          
          // Generate a pseudo-realistic image URL based on id
          let photo = `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=360&fit=crop&q=80`;
          if (hash % 2 === 0) photo = `https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=600&h=360&fit=crop&q=80`;
          else if (hash % 3 === 0) photo = `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=360&fit=crop&q=80`;

          // Calculate distance via Haversine
          const R = 6371;
          const dLat = (item.lat - lat) * Math.PI / 180;
          const dLon = (item.lon - lon) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat * Math.PI / 180) * Math.cos(item.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          return {
            id: item.id,
            name,
            address: item.tags?.['addr:street'] ? `${item.tags['addr:street']}, ${destination}` : destination,
            distance: (distKm).toFixed(1) + 'km',
            price, rating, image: photo,
            hash
          };
        }).filter(h => h && h.name);
        
        if (results.length > 0) {
          setHotels(results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
          setCachedData(cacheKey, results);
        } else {
          throw new Error('Empty');
        }
      } catch { 
        // Fallback dummy hotel
        const dummy = {
            id: 'fallback', name: 'Standard Tourist Hotel', address: destination,
            distance: '1.2km', price: 2500, rating: '4.2', hash: 1234,
            image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=360&fit=crop&q=80`
        };
        setHotels([dummy]); 
      }
      setLoading(false);
    };
    fetchHotels();
  }, [destination, lat, lon]);

  return { hotels, loading };
}

/* ══════════════════════════════════════════════════════
   COMPONENTS
══════════════════════════════════════════════════════ */
function ProgressBar({ currentStep }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {STEPS.map(step => {
          const done = currentStep > step.number;
          const current = currentStep === step.number;
          return (
            <div key={step.number} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded- flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 border-2
                ${done ? 'bg-primary border-primary text-white' : current ? 'bg-white border-primary text-primary' : 'bg-white border-border text-text-muted'}`}
                style={{ fontFamily: "'Poppins', sans-serif" }}>
                {done ? <CheckCircleIcon /> : step.number}
              </div>
              <span className={`mt-1.5 text-[10px] sm:text-xs font-medium hidden sm:block transition-colors duration-300
                ${current ? 'text-primary' : done ? 'text-navy' : 'text-text-muted'}`} style={{ fontFamily: "'Inter', sans-serif" }}>{step.label}</span>
            </div>
          );
        })}
        <div className="absolute top-4 sm:top-5 left-0 right-0 flex" style={{ paddingLeft: '8%', paddingRight: '8%' }}>
          {STEPS.slice(0, -1).map((step, idx) => (
            <div key={idx} className="h-0.5 flex-1 transition-all duration-500 mx-1" style={{ backgroundColor: currentStep > step.number ? 'var(--color-primary)' : 'var(--color-border)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// BookingPanel, StepHeader, CheckCircleIcon extracted to WizardSteps/Steps.jsx

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function CreateTrip() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', destination: '', latitude: null, longitude: null,
    travelMode: '', startDate: '', endDate: '', budget: '',
    bookingDetails: {}, accommodation: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [starterModal, setStarterModal] = useState(null); // { tripId, destination, matchKey }
  const [addingStarter, setAddingStarter] = useState(false);
  const [starterDone, setStarterDone] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const locationSearch = useLocationSearch();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  const { hotels, loading: hotelsLoading } = useHotelSearch(form.destination, form.latitude, form.longitude);
  const [accMode, setAccMode] = useState(''); // 'browse', 'booked', ''
  const [accForm, setAccForm] = useState({ name: '', checkIn: '', checkOut: '', pricePerNight: '', fromDay: '', toDay: '', bookedVia: '' });

  useEffect(() => {
    const handleOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const totalDays = form.startDate && form.endDate ? Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1 : 0;

  const canProceed = () => {
    switch (step) {
      case 1: return form.name.trim().length >= 2;
      case 2: return form.destination.trim().length >= 2;
      case 3: return form.travelMode !== '';
      case 4: return form.startDate && form.endDate && form.endDate >= form.startDate;
      case 5: return true; // Accommodation is optional
      case 6: return form.budget !== '' && Number(form.budget) >= 1;
      default: return false;
    }
  };

  const getStepError = () => {
    switch (step) {
      case 1: return form.name.trim().length < 2 ? 'Trip name must be at least 2 characters.' : '';
      case 2: return form.destination.trim().length < 2 ? 'Please select or type a valid destination.' : '';
      case 3: return form.travelMode === '' ? 'Please select a travel mode.' : '';
      case 4:
        if (!form.startDate || !form.endDate) return 'Please select both start and end dates.';
        if (form.endDate < form.startDate) return 'End date must be after start date.';
        return '';
      case 5: return '';
      case 6:
        if (form.budget === '' || Number(form.budget) < 1) return 'Please enter a budget of at least ₹1.';
        return '';
      default: return '';
    }
  };

  const nextStep = () => {
    if (canProceed() && step < 6) { setStep(s => s + 1); setError(''); }
    else if (!canProceed()) { setError(getStepError()); }
  };
  const prevStep = () => { if (step > 1) { setStep(s => s - 1); setError(''); } };

  /* ── Detect starter itinerary match ── */
  const findStarterMatch = (dest) => {
    if (!dest) return null;
    const d = dest.toLowerCase();
    for (const key of Object.keys(STARTER_ITINERARIES)) {
      if (d.includes(key)) return key;
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!canProceed()) { setError(getStepError()); return; }
    setLoading(true); setError('');
    try {
      const { data: newTrip } = await API.post('/trips', {
        name: form.name.trim(), destination: form.destination.trim(),
        latitude: form.latitude, longitude: form.longitude,
        travelMode: form.travelMode,
        startDate: form.startDate, endDate: form.endDate,
        budget: Number(form.budget),
        accommodation: form.accommodation
      });

      toast.success(`"${form.name.trim()}" has been created!`, 'Trip Created 🎉');

      // Check for starter itinerary match
      const matchKey = findStarterMatch(form.destination);
      if (matchKey) {
        setStarterModal({ tripId: newTrip._id, destination: form.destination, matchKey });
      } else {
        navigate('/dashboard');
      }
    } catch (err) { setError(err.response?.data?.message || 'Failed to create trip. Please check your inputs.'); }
    finally { setLoading(false); }
  };

  const handleAddStarter = async () => {
    if (!starterModal) return;
    setAddingStarter(true);
    try {
      const items = STARTER_ITINERARIES[starterModal.matchKey];
      for (const item of items) {
        await API.post(`/itinerary/${starterModal.tripId}`, {
          day: item.day,
          title: item.title,
          location: item.location,
          description: `${item.time} — ${item.description}`
        });
      }
      setStarterDone(true);
      setTimeout(() => {
        navigate(`/trip/${starterModal.tripId}?tab=itinerary`);
      }, 1200);
    } catch (err) {
      console.error('Failed to add starter itinerary:', err);
      navigate(`/trip/${starterModal.tripId}`);
    }
    setAddingStarter(false);
  };

  const handleLocationSelect = (s) => {
    const label = [s.name, s.country].filter(Boolean).join(', ');
    setForm(p => ({ ...p, destination: label, latitude: s.lat, longitude: s.lon }));
    locationSearch.setQuery(label); locationSearch.setSuggestions([]); setShowSuggestions(false);
  };

  const handleKey = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (step < 6 && canProceed()) nextStep();
    else if (step === 6 && canProceed()) handleSubmit();
  };

  const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const inputCls = (err) => `w-full border rounded-xl px-6 py-6 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy transition-colors ${err ? 'border-danger' : 'border-border'}`;

  const renderExternalLinks = () => {
    const dest = encodeURIComponent(form.destination);
    const links = [
      { l: 'Budget Hotels', url: 'https://budgethotels.in/' },
      { l: 'MakeMyTrip', url: `https://www.makemytrip.com/hotels/hotel-listing/?city=${dest}` },
      { l: 'Booking.com', url: `https://www.booking.com/searchresults.html?ss=${dest}` },
      { l: 'Goibibo', url: `https://www.goibibo.com/hotels/find-hotels-in-${dest}/` }
    ];
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {links.map((lnk) => (
          <a key={lnk.l} href={lnk.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl border border-navy text-navy text-xs font-semibold no-underline hover:bg-navy hover:text-white transition-all duration-150" style={{ fontFamily: "'Inter', sans-serif" }}>
            {lnk.l} <ExternalLink size={11} strokeWidth={2} />
          </a>
        ))}
      </div>
    );
  };

  const saveAccommodation = () => {
    if (!accForm.name.trim()) return;
    setForm(p => ({ ...p, accommodation: [...p.accommodation, { ...accForm, name: accForm.name.trim() }] }));
    setAccMode('');
    setAccForm({ name: '', checkIn: '', checkOut: '', pricePerNight: '', fromDay: '', toDay: '', bookedVia: '' });
    nextStep();
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-xl mx-auto px-6 sm:px-6 py-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-text-secondary hover:text-navy text-sm no-underline transition-colors mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>← Back to Dashboard</Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Plan Your Trip</h1>
          <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
            Step {step} of 6 <span className="hidden sm:inline">— {STEPS[step-1].label}</span>
          </p>
        </div>
        <ProgressBar currentStep={step} />

        <div className="bg-white rounded- p-6 sm:p-8 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
          {error && <div className="bg-danger-light text-danger p-6 rounded-xl mb-5 text-sm font-medium border border-danger/20 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}><AlertTriangle size={16} strokeWidth={1.5} />{error}</div>}

          {step === 1 && <Step1TripName form={form} setForm={setForm} handleKey={handleKey} inputCls={inputCls} />}
          {step === 2 && <Step2Destination form={form} setForm={setForm} locationSearch={locationSearch} inputRef={inputRef} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} suggestionsRef={suggestionsRef} handleLocationSelect={handleLocationSelect} handleKey={handleKey} inputCls={inputCls} />}
          {step === 3 && <Step3TravelMode form={form} setForm={setForm} TRAVEL_MODES={TRAVEL_MODES} BOOKING_CONFIG={BOOKING_CONFIG} nextStep={nextStep} />}
          {step === 4 && <Step4Dates form={form} setForm={setForm} toDateStr={toDateStr} totalDays={totalDays} />}
          {step === 5 && <Step5Accommodation form={form} accMode={accMode} setAccMode={setAccMode} accForm={accForm} setAccForm={setAccForm} hotels={hotels} hotelsLoading={hotelsLoading} renderExternalLinks={renderExternalLinks} saveAccommodation={saveAccommodation} nextStep={nextStep} toDateStr={toDateStr} totalDays={totalDays} />}
          {step === 6 && <Step6Budget form={form} setForm={setForm} handleKey={handleKey} inputCls={inputCls} totalDays={totalDays} />}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button type="button" onClick={prevStep} className="flex-1 py-6 rounded-xl border border-border text-text-secondary font-semibold text-sm hover:bg-border-light hover:text-navy transition-colors cursor-pointer bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>← Back</button>
            )}
            {step < 6 ? (
              <button type="button" onClick={nextStep} disabled={!canProceed()} className={`flex-1 py-6 rounded-xl font-semibold text-sm border-0 transition-all cursor-pointer ${canProceed() ? 'bg-primary hover:bg-primary-dark text-white' : 'bg-border-light text-text-muted cursor-not-allowed'}`} style={{ fontFamily: "'Inter', sans-serif" }}>Next →</button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={!canProceed() || loading} className={`flex-1 py-6 rounded-xl font-semibold text-sm border-0 transition-all cursor-pointer ${canProceed() && !loading ? 'bg-accent hover:bg-accent-dark text-white' : 'bg-border-light text-text-muted cursor-not-allowed'}`} style={{ fontFamily: "'Inter', sans-serif", boxShadow: canProceed() && !loading ? '0 4px 12px rgba(255,107,53,0.35)' : 'none' }}>{loading ? 'Creating...' : 'Create Trip'}</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Starter Itinerary Modal (Area 3) ── */}
      {starterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-md p-6">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-border shadow-2xl animate-in fade-in zoom-in duration-300 text-center">
            {starterDone ? (
              <>
                <div className="w-16 h-16 bg-success/10 text-success rounded- flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-black text-navy mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Starter plan added!</h3>
                <p className="text-sm text-text-secondary">Redirecting to your itinerary...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-accent/10 text-accent rounded- flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-xl font-black text-navy mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Plan your {starterModal.destination.split(',')[0]} trip
                </h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                  We have a starter itinerary for <span className="font-bold text-navy">{starterModal.destination.split(',')[0]}</span>. Want us to add it? You can edit or delete anytime.
                </p>
                <div className="grid gap-3">
                  <button
                    onClick={handleAddStarter}
                    disabled={addingStarter}
                    className="w-full bg-accent hover:bg-accent-dark text-white py-6.5 rounded- font-bold text-sm border-0 cursor-pointer transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {addingStarter ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded- animate-spin" /> Adding...</> : <><Sparkles size={16} /> Yes, add starter plan</>}
                  </button>
                  <button
                    onClick={() => navigate(`/trip/${starterModal.tripId}`)}
                    className="w-full bg-white border-2 border-navy text-navy py-6.5 rounded- font-bold text-sm cursor-pointer transition-all hover:bg-navy hover:text-white"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    I'll plan myself
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}