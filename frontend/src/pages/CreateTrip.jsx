import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Pen, MapPin, Navigation, Calendar, Wallet, Building2,
  Plane, Train, Bus, Car, Search, AlertTriangle, ExternalLink,
  ChevronDown, ChevronUp, X, Wifi, Bath, Flame, ParkingCircle, Star
} from 'lucide-react';

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
function useHotelSearch(destination) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!destination) return;
    const fetchHotels = async () => {
      setLoading(true);
      const cacheKey = 'wv_hotels_' + destination.toLowerCase();
      const cached = getCachedData(cacheKey);
      if (cached) { setHotels(cached); setLoading(false); return; }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=hotel+in+${encodeURIComponent(destination)}&limit=6`);
        const data = await res.json();
        const results = data.map(item => {
          const hash = String(item.place_id).split('').reduce((a,c)=>a+c.charCodeAt(0),0) + (item.name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0);
          const price = Math.round((800 + (hash % 4700)) / 50) * 50;
          const rating = (3.0 + ((hash % 20) / 10)).toFixed(1);
          const images = [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=360&fit=crop&q=80',
            'https://images.unsplash.com/photo-1551882547-ff40c0d1398c?w=600&h=360&fit=crop&q=80',
            'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600&h=360&fit=crop&q=80',
            'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=600&h=360&fit=crop&q=80',
            'https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?w=600&h=360&fit=crop&q=80',
          ];
          return {
            id: item.place_id,
            name: item.name || 'Hotel',
            address: item.display_name.split(',').slice(0, 3).join(', '),
            distance: (0.5 + (hash % 40)/10).toFixed(1) + 'km',
            price, rating, image: images[hash % images.length],
            amenities: [{Icon:Wifi, l:'Wifi'}, {Icon:Bath, l:'Tub'}, {Icon:Flame, l:'BBQ'}, {Icon:ParkingCircle, l:'Parking'}].slice(0, 3 + (hash%2))
          };
        });
        setHotels(results);
        setCachedData(cacheKey, results);
      } catch { setHotels([]); }
      setLoading(false);
    };
    fetchHotels();
  }, [destination]);

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
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 border-2
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

const CheckCircleIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;

function BookingPanel({ modeId, bookingData, onChange, onSkip }) {
  const [expanded, setExpanded] = useState(false);
  const config = BOOKING_CONFIG[modeId];
  if (!config) return null;
  const handleField = (key, value) => onChange({ ...bookingData, [key]: value });

  return (
    <div className="mt-4 space-y-3">
      {config.links.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Search & Book</p>
          <div className="flex flex-wrap gap-2">
            {config.links.map(link => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-navy text-navy text-xs font-semibold no-underline hover:bg-navy hover:text-white transition-all duration-150" style={{ fontFamily: "'Inter', sans-serif" }}>
                {link.label} <ExternalLink size={11} strokeWidth={2} />
              </a>
            ))}
          </div>
        </div>
      )}
      {config.fields.length > 0 && (
        <div>
          <button type="button" onClick={() => setExpanded(p => !p)} className="flex items-center gap-1.5 text-xs font-semibold text-primary cursor-pointer bg-transparent border-0 px-0 py-1 hover:text-primary-dark transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
            {expanded ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />} {expanded ? 'Hide booking details' : 'Already booked? Add details'}
          </button>
          {expanded && (
            <div className="mt-3 bg-bg rounded-xl p-4 border border-border space-y-3">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Booking Details <span className="text-text-muted font-normal normal-case">(optional)</span></p>
              {config.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>{field.label} {field.required && <span className="text-danger ml-0.5">*</span>}</label>
                  <input type={field.type || 'text'} placeholder={field.placeholder} value={bookingData?.[field.key] || ''} onChange={e => handleField(field.key, e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy transition-colors" style={{ fontFamily: "'Inter', sans-serif" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button type="button" onClick={onSkip} className="text-xs text-text-muted hover:text-text-secondary cursor-pointer bg-transparent border-0 px-0 py-0.5 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>Skip for now</button>
    </div>
  );
}

const StepHeader = ({ Icon, title, subtitle }) => (
  <div className="text-center mb-6">
    <div className="flex justify-center mb-3">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary">
        <Icon size={24} strokeWidth={1.5} />
      </div>
    </div>
    <h2 className="text-lg sm:text-xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h2>
    {subtitle && <p className="text-text-secondary text-xs sm:text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>{subtitle}</p>}
  </div>
);

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
  const navigate = useNavigate();

  const locationSearch = useLocationSearch();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  const { hotels, loading: hotelsLoading } = useHotelSearch(form.destination);
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

  const nextStep = () => { if (canProceed() && step < 6) { setStep(s => s + 1); setError(''); } };
  const prevStep = () => { if (step > 1) { setStep(s => s - 1); setError(''); } };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setLoading(true); setError('');
    try {
      await API.post('/trips', {
        name: form.name.trim(), destination: form.destination.trim(),
        latitude: form.latitude, longitude: form.longitude,
        travelMode: form.travelMode,
        startDate: form.startDate, endDate: form.endDate,
        budget: Number(form.budget),
        accommodation: form.accommodation
      });
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Failed to create trip.'); }
    finally { setLoading(false); }
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
  const inputCls = (err) => `w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy transition-colors ${err ? 'border-danger' : 'border-border'}`;

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
          <a key={lnk.l} href={lnk.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-navy text-navy text-xs font-semibold no-underline hover:bg-navy hover:text-white transition-all duration-150" style={{ fontFamily: "'Inter', sans-serif" }}>
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
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-text-secondary hover:text-navy text-sm no-underline transition-colors mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>← Back to Dashboard</Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Plan Your Trip</h1>
          <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
            Step {step} of 6 <span className="hidden sm:inline">— {STEPS[step-1].label}</span>
          </p>
        </div>
        <ProgressBar currentStep={step} />

        <div className="bg-white rounded-xl p-6 sm:p-8 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
          {error && <div className="bg-danger-light text-danger p-3 rounded-lg mb-5 text-sm font-medium border border-danger/20 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}><AlertTriangle size={16} strokeWidth={1.5} />{error}</div>}

          {step === 1 && (
            <div>
              <StepHeader Icon={Pen} title="What's your trip called?" subtitle="Give your trip a memorable name" />
              <input type="text" autoFocus placeholder="e.g. Goa Summer Trip" className={inputCls(false) + ' text-center'} style={{ fontFamily: "'Inter', sans-serif" }} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} onKeyDown={handleKey} maxLength={60} />
            </div>
          )}

          {step === 2 && (
            <div>
              <StepHeader Icon={MapPin} title="Where are you headed?" subtitle="Search for a city or destination" />
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={17} strokeWidth={1.5} />
                  <input ref={inputRef} type="text" autoFocus placeholder="Search — e.g. Goa, Manali, Paris..." className={inputCls(false) + ' pl-10 pr-10'} style={{ fontFamily: "'Inter', sans-serif" }} value={locationSearch.query || form.destination} onChange={e => { locationSearch.search(e.target.value); setForm(p => ({ ...p, destination: e.target.value, latitude: null, longitude: null })); setShowSuggestions(true); }} onFocus={() => { if (locationSearch.suggestions.length) setShowSuggestions(true); }} onKeyDown={handleKey} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {locationSearch.isSearching ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : form.destination ? <button type="button" onClick={() => { locationSearch.clear(); setForm(p => ({ ...p, destination: '', latitude: null, longitude: null })); }} className="text-text-muted hover:text-navy cursor-pointer bg-transparent border-0 p-0 flex items-center"><X size={15} strokeWidth={2} /></button> : null}
                  </div>
                </div>
                {showSuggestions && locationSearch.suggestions.length > 0 && (
                  <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl overflow-hidden z-30" style={{ boxShadow: 'var(--shadow-lg)' }}>
                    {locationSearch.suggestions.map((s, idx) => (
                      <button key={idx} type="button" onClick={() => handleLocationSelect(s)} className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-0 border-b border-border-light last:border-b-0 bg-transparent flex items-start gap-3 cursor-pointer">
                        <MapPin size={14} strokeWidth={1.5} className="text-accent mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{s.city || s.name} {s.country && <span className="text-text-muted font-normal">, {s.country}</span>}</p>
                          <p className="text-xs text-text-muted truncate mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{s.displayName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <StepHeader Icon={Navigation} title="How are you traveling?" subtitle="Select your primary mode of transport" />
              <div className="grid grid-cols-4 gap-3 mb-4">
                {TRAVEL_MODES.map(mode => {
                  const isSelected = form.travelMode === mode.id;
                  const MIcon = mode.Icon;
                  return (
                    <button key={mode.id} type="button" onClick={() => setForm(p => ({ ...p, travelMode: mode.id, bookingDetails: {} }))} className={`flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 cursor-pointer transition-all duration-200 bg-white ${isSelected ? 'border-accent shadow-md' : 'border-border hover:border-primary/40 hover:bg-primary-50'}`} style={{ boxShadow: isSelected ? '0 0 0 1px #FF6B35' : 'none' }}>
                      <MIcon size={28} strokeWidth={1.5} color={isSelected ? '#FF6B35' : '#2563EB'} />
                      <span className={`text-xs font-bold ${isSelected ? 'text-accent' : 'text-navy'}`} style={{ fontFamily: "'Poppins', sans-serif" }}>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
              {form.travelMode && (
                <div className="border-t border-border pt-4">
                  <BookingPanel modeId={form.travelMode} bookingData={form.bookingDetails} onChange={d => setForm(p => ({ ...p, bookingDetails: d }))} onSkip={() => nextStep()} />
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <StepHeader Icon={Calendar} title="When are you going?" subtitle="Pick your travel dates" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>Start Date</label>
                  <DatePicker selected={form.startDate ? new Date(form.startDate + 'T12:00:00') : null} onChange={date => { if (date) { const s = toDateStr(date); setForm(p => ({ ...p, startDate: s, endDate: (p.endDate && s > p.endDate) ? '' : p.endDate })); } else setForm(p => ({ ...p, startDate: '' })); }} minDate={new Date()} dateFormat="yyyy-MM-dd" placeholderText="Select start date" className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy" wrapperClassName="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>End Date</label>
                  <DatePicker selected={form.endDate ? new Date(form.endDate + 'T12:00:00') : null} onChange={date => setForm(p => ({ ...p, endDate: date ? toDateStr(date) : '' }))} minDate={form.startDate ? new Date(form.startDate + 'T12:00:00') : new Date()} dateFormat="yyyy-MM-dd" placeholderText="Select end date" className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy" wrapperClassName="w-full" />
                </div>
              </div>
              {totalDays > 0 && <div className="mt-4 bg-primary-50 rounded-lg px-4 py-3 text-center border border-primary-100"><p className="text-sm text-primary font-bold">{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</p></div>}
            </div>
          )}

          {step === 5 && (
            <div>
              <StepHeader Icon={Building2} title="Where are you staying?" subtitle="Let's add your accommodation details" />
              
              {!accMode && form.accommodation.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-navy mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Saved Accommodations</h4>
                  <div className="space-y-2">
                    {form.accommodation.map((acc, i) => (
                      <div key={i} className="bg-success-light border border-success/30 p-3 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-navy leading-none" style={{ fontFamily: "'Inter', sans-serif" }}>{acc.name}</p>
                          <p className="text-[11px] text-success font-medium mt-1 uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Day {acc.fromDay} - Day {acc.toDay}</p>
                        </div>
                        <CheckCircleIcon />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {accMode === '' && (
                <div className="space-y-3">
                  <button type="button" onClick={() => setAccMode('browse')} className="w-full bg-white border-2 border-border hover:border-primary/40 hover:bg-primary-50 text-navy font-bold py-4 rounded-xl transition-all duration-150 cursor-pointer text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Search Hotels Near Destination</button>
                  <button type="button" onClick={() => setAccMode('booked')} className="w-full bg-white border-2 border-border hover:border-accent/40 hover:bg-accent-50 text-navy font-bold py-4 rounded-xl transition-all duration-150 cursor-pointer text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Already Booked? Add Details</button>
                  <button type="button" onClick={() => nextStep()} className="w-full text-text-muted hover:text-text-secondary cursor-pointer bg-transparent border-0 px-0 py-2 transition-colors text-xs font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>{form.accommodation.length > 0 ? 'Continue to Budget' : 'Skip for now (add later)'}</button>
                </div>
              )}

              {accMode === 'browse' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Browsing spots near {form.destination}</h3>
                    <button type="button" onClick={() => setAccMode('')} className="text-xs text-primary font-semibold border-0 bg-transparent cursor-pointer">← Back</button>
                  </div>
                  {hotelsLoading ? (
                    <div className="py-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
                  ) : hotels.length === 0 ? (
                    <div className="text-center py-6 text-sm text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>No hotels found for this location.</div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {hotels.map((h, i) => (
                        <div key={i} className="bg-white rounded-xl overflow-hidden border border-border flex flex-col sm:flex-row group" style={{ boxShadow: 'var(--shadow-card)' }}>
                          <div className="w-full sm:w-32 h-32 shrink-0 relative bg-bg">
                            <img src={h.image} alt={h.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-navy text-sm line-clamp-1 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>{h.name}</h4>
                                <div className="flex items-center gap-0.5 bg-success text-white px-1.5 rounded text-[10px] font-bold"><Star size={8} fill="#fff" strokeWidth={0}/> {h.rating}</div>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-text-secondary">
                                {h.amenities.map((am, idx) => {
                                  const AIcon = am.Icon; return <div key={idx} className="flex flex-col items-center gap-0.5"><AIcon size={12} strokeWidth={1.5} /><span className="text-[8px]">{am.l}</span></div>
                                })}
                              </div>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                              <div>
                                <p className="text-lg font-bold text-navy leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>₹{h.price.toLocaleString()}</p>
                                <p className="text-[9px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>per night • {h.distance} away</p>
                              </div>
                              <button type="button" onClick={() => { setAccForm(p => ({ ...p, name: h.name, pricePerNight: h.price })); setAccMode('booked'); }} className="bg-accent hover:bg-accent-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer transition-colors">Select</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {renderExternalLinks()}
                </div>
              )}

              {accMode === 'booked' && (
                <div className="bg-bg rounded-xl p-4 border border-border mt-2 space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Hotel Details</h4>
                    <button type="button" onClick={() => setAccMode('')} className="text-xs text-primary font-semibold border-0 bg-transparent cursor-pointer">Cancel</button>
                  </div>
                  <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Hotel Name *</label><input type="text" placeholder="e.g. Taj Hotel" value={accForm.name} onChange={e => setAccForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Check-in Date</label><DatePicker selected={accForm.checkIn ? new Date(accForm.checkIn+'T12:00:00') : null} onChange={d => setAccForm(p => ({...p, checkIn: d ? toDateStr(d) : ''}))} dateFormat="yyyy-MM-dd" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholderText="Check-in" wrapperClassName="w-full" /></div>
                    <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Check-out Date</label><DatePicker selected={accForm.checkOut ? new Date(accForm.checkOut+'T12:00:00') : null} onChange={d => setAccForm(p => ({...p, checkOut: d ? toDateStr(d) : ''}))} dateFormat="yyyy-MM-dd" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholderText="Check-out" wrapperClassName="w-full" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>From Day</label><input type="number" min="1" placeholder="1" value={accForm.fromDay} onChange={e => setAccForm(p => ({ ...p, fromDay: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                    <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>To Day</label><input type="number" min="1" placeholder={totalDays || 7} value={accForm.toDay} onChange={e => setAccForm(p => ({ ...p, toDay: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                    <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Price/Night (₹)</label><input type="number" min="0" placeholder="0" value={accForm.pricePerNight} onChange={e => setAccForm(p => ({ ...p, pricePerNight: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  </div>
                  <button type="button" onClick={saveAccommodation} disabled={!accForm.name.trim()} className="w-full bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-bold py-3 rounded-lg text-sm border-0 transition-all duration-150 cursor-pointer mt-2" style={{ boxShadow: accForm.name.trim() ? '0 4px 12px rgba(255,107,53,0.3)' : 'none' }}>Save Accommodation</button>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div>
              <StepHeader Icon={Wallet} title="Set your budget" subtitle="We'll track your spending against this" />
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy font-bold text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>₹</span><input type="number" autoFocus placeholder="10000" min="1" step="1" className={inputCls(false) + ' pl-10 text-xl font-bold text-center'} style={{ fontFamily: "'Poppins', sans-serif" }} value={form.budget} onChange={e => { const v = e.target.value; if (v === '' || Number(v) >= 0) setForm(p => ({ ...p, budget: v })); }} onKeyDown={handleKey} /></div>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">{[5000, 10000, 15000, 25000, 50000].map(amount => (<button key={amount} type="button" onClick={() => setForm(p => ({ ...p, budget: String(amount) }))} className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-150 ${form.budget === String(amount) ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'}`} style={{ fontFamily: "'Inter', sans-serif" }}>₹{amount.toLocaleString()}</button>))}</div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button type="button" onClick={prevStep} className="flex-1 py-3 rounded-lg border border-border text-text-secondary font-semibold text-sm hover:bg-border-light hover:text-navy transition-colors cursor-pointer bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>← Back</button>
            )}
            {step < 6 ? (
              <button type="button" onClick={nextStep} disabled={!canProceed()} className={`flex-1 py-3 rounded-lg font-semibold text-sm border-0 transition-all cursor-pointer ${canProceed() ? 'bg-primary hover:bg-primary-dark text-white' : 'bg-border-light text-text-muted cursor-not-allowed'}`} style={{ fontFamily: "'Inter', sans-serif" }}>Next →</button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={!canProceed() || loading} className={`flex-1 py-3 rounded-lg font-semibold text-sm border-0 transition-all cursor-pointer ${canProceed() && !loading ? 'bg-accent hover:bg-accent-dark text-white' : 'bg-border-light text-text-muted cursor-not-allowed'}`} style={{ fontFamily: "'Inter', sans-serif", boxShadow: canProceed() && !loading ? '0 4px 12px rgba(255,107,53,0.35)' : 'none' }}>{loading ? 'Creating...' : 'Create Trip'}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}