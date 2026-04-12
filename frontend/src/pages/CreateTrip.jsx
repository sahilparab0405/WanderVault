import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Pen, MapPin, Navigation, Calendar, Wallet,
  Plane, Train, Bus, Car,
  Search, AlertTriangle, ExternalLink,
  ChevronDown, ChevronUp, X,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */

const STEPS = [
  { number: 1, label: 'Trip Name',   Icon: Pen },
  { number: 2, label: 'Destination', Icon: MapPin },
  { number: 3, label: 'Travel Mode', Icon: Navigation },
  { number: 4, label: 'Dates',       Icon: Calendar },
  { number: 5, label: 'Budget',      Icon: Wallet },
];

const TRAVEL_MODES = [
  { id: 'flight', label: 'Flight', Icon: Plane },
  { id: 'train',  label: 'Train',  Icon: Train },
  { id: 'bus',    label: 'Bus',    Icon: Bus   },
  { id: 'car',    label: 'Car',    Icon: Car   },
];

/* Booking config per mode */
const BOOKING_CONFIG = {
  flight: {
    links: [
      { label: 'MakeMyTrip', url: 'https://www.makemytrip.com/flights/', },
      { label: 'Goibibo',    url: 'https://www.goibibo.com/flights/',    },
      { label: 'Cleartrip',  url: 'https://www.cleartrip.com/flights/',  },
    ],
    fields: [
      { key: 'airline',    label: 'Airline Name',     placeholder: 'e.g. IndiGo',    required: true  },
      { key: 'flightNo',   label: 'Flight Number',    placeholder: 'e.g. 6E 2341',   required: false },
      { key: 'depTime',    label: 'Departure Time',   placeholder: 'hh:mm',          type: 'time',   required: false },
      { key: 'arrTime',    label: 'Arrival Time',     placeholder: 'hh:mm',          type: 'time',   required: false },
    ],
  },
  train: {
    links: [
      { label: 'IRCTC', url: 'https://www.irctc.co.in/', },
    ],
    fields: [
      { key: 'trainName', label: 'Train Name',      placeholder: 'e.g. Rajdhani Express', required: true  },
      { key: 'pnr',       label: 'PNR Number',      placeholder: 'e.g. 1234567890',        required: false },
      { key: 'depTime',   label: 'Departure Time',  placeholder: 'hh:mm', type: 'time',    required: false },
      { key: 'arrTime',   label: 'Arrival Time',    placeholder: 'hh:mm', type: 'time',    required: false },
    ],
  },
  bus: {
    links: [
      { label: 'RedBus', url: 'https://www.redbus.in/', },
    ],
    fields: [
      { key: 'operator',  label: 'Bus Operator',    placeholder: 'e.g. VRL Travels',  required: true  },
      { key: 'ticketNo',  label: 'Ticket Number',   placeholder: 'e.g. RB123456',     required: false },
      { key: 'depTime',   label: 'Departure Time',  placeholder: 'hh:mm', type: 'time', required: false },
      { key: 'arrTime',   label: 'Arrival Time',    placeholder: 'hh:mm', type: 'time', required: false },
    ],
  },
  car: {
    links: [],
    fields: [
      { key: 'depTime', label: 'Planned Departure', placeholder: 'hh:mm', type: 'time', required: false },
    ],
  },
};

/* ══════════════════════════════════════════════════════
   LOCATION SEARCH HOOK  (300ms debounce + localStorage cache)
══════════════════════════════════════════════════════ */

const LOC_CACHE_PREFIX = 'wv_loc_';
const LOC_CACHE_TTL    = 1000 * 60 * 60 * 24; // 24 h

function useLocationSearch() {
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback((value) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      const cacheKey = LOC_CACHE_PREFIX + value.trim().toLowerCase();
      try {
        // Check cache first
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < LOC_CACHE_TTL) {
            setSuggestions(parsed.data);
            setIsSearching(false);
            return;
          }
        }
        // Fetch from Nominatim
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value.trim())}&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        const results = data.map(item => ({
          displayName: item.display_name,
          name:    item.name || item.display_name.split(',')[0],
          city:    item.address?.city || item.address?.town || item.address?.village || item.name || '',
          country: item.address?.country || '',
          state:   item.address?.state || '',
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));
        setSuggestions(results);
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: results }));
      } catch {
        setSuggestions([]);
      }
      setIsSearching(false);
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setIsSearching(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { query, setQuery, suggestions, setSuggestions, isSearching, search, clear };
}

/* ══════════════════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════════════════ */

function ProgressBar({ currentStep }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {STEPS.map(step => {
          const done    = currentStep > step.number;
          const current = currentStep === step.number;
          return (
            <div key={step.number} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
                ${done    ? 'bg-primary border-primary text-white'
                : current ? 'bg-white border-primary text-primary'
                :           'bg-white border-border text-text-muted'}`}
                style={{ fontFamily: "'Poppins', sans-serif" }}>
                {done
                  ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : step.number}
              </div>
              <span className={`mt-1.5 text-xs font-medium hidden sm:block transition-colors duration-300
                ${current ? 'text-primary' : done ? 'text-navy' : 'text-text-muted'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}>
                {step.label}
              </span>
            </div>
          );
        })}
        {/* Connecting progress lines */}
        <div className="absolute top-5 left-0 right-0 flex" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
          {STEPS.slice(0, -1).map((step, idx) => (
            <div key={idx} className="h-0.5 flex-1 transition-all duration-500 mx-1"
              style={{ backgroundColor: currentStep > step.number ? 'var(--color-primary)' : 'var(--color-border)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   BOOKING PANEL (After travel mode selected)
══════════════════════════════════════════════════════ */

function BookingPanel({ modeId, bookingData, onChange }) {
  const [expanded, setExpanded] = useState(false); // "Already booked" form
  const config = BOOKING_CONFIG[modeId];
  if (!config) return null;

  const handleField = (key, value) => onChange({ ...bookingData, [key]: value });

  return (
    <div className="mt-4 space-y-3">

      {/* External booking links */}
      {config.links.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider"
             style={{ fontFamily: "'Inter', sans-serif" }}>
            Search & Book
          </p>
          <div className="flex flex-wrap gap-2">
            {config.links.map(link => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-navy text-navy text-xs font-semibold no-underline hover:bg-navy hover:text-white transition-all duration-150"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {link.label}
                <ExternalLink size={11} strokeWidth={2} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Already booked toggle */}
      {config.fields.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary cursor-pointer bg-transparent border-0 px-0 py-1 hover:text-primary-dark transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {expanded ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
            {expanded ? 'Hide booking details' : 'Already booked? Add details'}
          </button>

          {expanded && (
            <div className="mt-3 bg-bg rounded-xl p-4 border border-border space-y-3">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1"
                 style={{ fontFamily: "'Inter', sans-serif" }}>
                Booking Details <span className="text-text-muted font-normal normal-case">(optional)</span>
              </p>
              {config.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-navy mb-1"
                         style={{ fontFamily: "'Inter', sans-serif" }}>
                    {field.label}
                    {field.required && <span className="text-danger ml-0.5">*</span>}
                  </label>
                  <input
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={bookingData?.[field.key] || ''}
                    onChange={e => handleField(field.key, e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy transition-colors"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skip for now */}
      <button
        type="button"
        onClick={() => { setExpanded(false); onChange({}); }}
        className="text-xs text-text-muted hover:text-text-secondary cursor-pointer bg-transparent border-0 px-0 py-0.5 transition-colors"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Skip for now
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */

export default function CreateTrip() {
  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState({
    name: '', destination: '', latitude: null, longitude: null,
    travelMode: '', startDate: '', endDate: '', budget: '',
    bookingDetails: {},
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const locationSearch                    = useLocationSearch();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef                    = useRef(null);
  const inputRef                          = useRef(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleOutside = (e) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
        inputRef.current      && !inputRef.current.contains(e.target)
      ) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  /* ─── Validation ─── */
  const canProceed = () => {
    switch (step) {
      case 1: return form.name.trim().length >= 2;
      case 2: return form.destination.trim().length >= 2;
      case 3: return form.travelMode !== '';
      case 4: return form.startDate && form.endDate && form.endDate >= form.startDate;
      case 5: return form.budget !== '' && Number(form.budget) >= 1;
      default: return false;
    }
  };

  const nextStep = () => { if (canProceed() && step < 5) { setStep(s => s + 1); setError(''); } };
  const prevStep = () => { if (step > 1) { setStep(s => s - 1); setError(''); } };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setLoading(true); setError('');
    try {
      await API.post('/trips', {
        name:       form.name.trim(),
        destination: form.destination.trim(),
        latitude:   form.latitude,
        longitude:  form.longitude,
        travelMode: form.travelMode,
        startDate:  form.startDate,
        endDate:    form.endDate,
        budget:     Number(form.budget),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip. Please try again.');
    }
    setLoading(false);
  };

  const handleLocationSelect = (s) => {
    const label = [s.name, s.country].filter(Boolean).join(', ');
    setForm(prev => ({ ...prev, destination: label, latitude: s.lat, longitude: s.lon }));
    locationSearch.setQuery(label);
    locationSearch.setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKey = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (step < 5 && canProceed()) nextStep();
    else if (step === 5 && canProceed()) handleSubmit();
  };

  /* Date helpers */
  const toDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const tripDuration = form.startDate && form.endDate
    ? Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1
    : 0;

  /* ─── Shared input class ─── */
  const inputCls = (err) =>
    `w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy transition-colors ${err ? 'border-danger' : 'border-border'}`;

  /* ─── Step icon header ─── */
  const StepHeader = ({ Icon, title, subtitle }) => (
    <div className="text-center mb-6">
      <div className="flex justify-center mb-3">
        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary">
          <Icon size={24} strokeWidth={1.5} />
        </div>
      </div>
      <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h2>
      {subtitle && <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>{subtitle}</p>}
    </div>
  );

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">

        {/* Back */}
        <Link to="/dashboard"
          className="inline-flex items-center gap-1 text-text-secondary hover:text-navy text-sm no-underline transition-colors mb-6"
          style={{ fontFamily: "'Inter', sans-serif" }}>
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Plan Your Trip</h1>
          <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
            Step {step} of 5 — {STEPS[step-1].label}
          </p>
        </div>

        <ProgressBar currentStep={step} />

        {/* Card */}
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>

          {/* Error banner */}
          {error && (
            <div className="bg-danger-light text-danger p-3 rounded-lg mb-5 text-sm font-medium border border-danger/20 flex items-center gap-2"
                 style={{ fontFamily: "'Inter', sans-serif" }}>
              <AlertTriangle size={16} strokeWidth={1.5} />{error}
            </div>
          )}

          {/* ───────────────── STEP 1 — Name ───────────────── */}
          {step === 1 && (
            <div>
              <StepHeader Icon={Pen} title="What's your trip called?" subtitle="Give your trip a memorable name" />
              <input
                type="text" autoFocus id="step-trip-name"
                placeholder="e.g. Goa Summer Trip"
                className={inputCls(false) + ' text-center'}
                style={{ fontFamily: "'Inter', sans-serif" }}
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                onKeyDown={handleKey}
                maxLength={60}
              />
              <div className="mt-2 text-center text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                {form.name.trim().length > 0 && form.name.trim().length < 2
                  ? <span className="text-danger flex items-center justify-center gap-1"><AlertTriangle size={11} strokeWidth={1.5} />At least 2 characters required</span>
                  : form.name.trim().length >= 2
                  ? <span className="text-success">Looks good</span>
                  : null}
              </div>
            </div>
          )}

          {/* ───────────────── STEP 2 — Destination ───────────────── */}
          {step === 2 && (
            <div>
              <StepHeader Icon={MapPin} title="Where are you headed?" subtitle="Search for a city or destination" />
              <div className="relative">
                {/* Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={17} strokeWidth={1.5} />
                  <input
                    ref={inputRef} type="text" autoFocus
                    id="step-destination"
                    placeholder="Search — e.g. Goa, Manali, Paris..."
                    className={inputCls(false) + ' pl-10 pr-10'}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    value={locationSearch.query || form.destination}
                    onChange={e => {
                      locationSearch.search(e.target.value);
                      setForm(p => ({ ...p, destination: e.target.value, latitude: null, longitude: null }));
                      setShowSuggestions(true);
                    }}
                    onFocus={() => { if (locationSearch.suggestions.length) setShowSuggestions(true); }}
                    onKeyDown={handleKey}
                  />
                  {/* Spinner / Clear */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {locationSearch.isSearching
                      ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      : form.destination
                      ? <button type="button" onClick={() => { locationSearch.clear(); setForm(p => ({ ...p, destination: '', latitude: null, longitude: null })); }}
                          className="text-text-muted hover:text-navy cursor-pointer bg-transparent border-0 p-0 flex items-center" aria-label="Clear">
                          <X size={15} strokeWidth={2} />
                        </button>
                      : null}
                  </div>
                </div>

                {/* Dropdown */}
                {showSuggestions && locationSearch.suggestions.length > 0 && (
                  <div ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl overflow-hidden z-30"
                    style={{ boxShadow: 'var(--shadow-lg)' }}>
                    {locationSearch.suggestions.map((s, idx) => (
                      <button key={idx} type="button" id={`suggestion-${idx}`}
                        onClick={() => handleLocationSelect(s)}
                        className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-0 border-b border-border-light last:border-b-0 bg-transparent flex items-start gap-3 cursor-pointer">
                        <MapPin size={14} strokeWidth={1.5} className="text-accent mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {s.city || s.name}
                            {s.country && <span className="text-text-muted font-normal">, {s.country}</span>}
                          </p>
                          <p className="text-xs text-text-muted truncate mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {s.displayName}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmed location badge */}
              {form.latitude && form.longitude && (
                <div className="mt-3 flex items-center gap-2 text-success text-sm bg-success-light px-3 py-2 rounded-lg"
                     style={{ fontFamily: "'Inter', sans-serif" }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Location confirmed — {form.destination}
                </div>
              )}

              <p className="text-text-muted text-xs mt-3 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                Powered by OpenStreetMap · Results cached for 24 h
              </p>
            </div>
          )}

          {/* ───────────────── STEP 3 — Travel Mode ───────────────── */}
          {step === 3 && (
            <div>
              <StepHeader Icon={Navigation} title="How are you traveling?" subtitle="Select your primary mode of transport" />

              {/* Mode selector cards */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {TRAVEL_MODES.map(mode => {
                  const isSelected = form.travelMode === mode.id;
                  const MIcon = mode.Icon;
                  return (
                    <button
                      key={mode.id} type="button"
                      id={`travel-mode-${mode.id}`}
                      onClick={() => setForm(p => ({ ...p, travelMode: mode.id, bookingDetails: {} }))}
                      className={`flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 cursor-pointer transition-all duration-200 bg-white
                        ${isSelected
                          ? 'border-accent shadow-md'
                          : 'border-border hover:border-primary/40 hover:bg-primary-50'}`}
                      style={{ boxShadow: isSelected ? '0 0 0 1px #FF6B35' : 'none' }}
                    >
                      <MIcon size={28} strokeWidth={1.5} color={isSelected ? '#FF6B35' : '#2563EB'} />
                      <span className={`text-xs font-bold ${isSelected ? 'text-accent' : 'text-navy'}`}
                            style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {mode.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Booking panel (only when a mode is selected) */}
              {form.travelMode && (
                <div className="border-t border-border pt-4">
                  <BookingPanel
                    modeId={form.travelMode}
                    bookingData={form.bookingDetails}
                    onChange={d => setForm(p => ({ ...p, bookingDetails: d }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* ───────────────── STEP 4 — Dates ───────────────── */}
          {step === 4 && (
            <div>
              <StepHeader Icon={Calendar} title="When are you going?" subtitle="Pick your travel dates" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5"
                         style={{ fontFamily: "'Inter', sans-serif" }}>Start Date</label>
                  <DatePicker
                    selected={form.startDate ? new Date(form.startDate + 'T12:00:00') : null}
                    onChange={date => {
                      if (date) {
                        const s = toDateStr(date);
                        if (form.endDate && s > form.endDate) setForm(p => ({ ...p, startDate: s, endDate: '' }));
                        else setForm(p => ({ ...p, startDate: s }));
                      } else setForm(p => ({ ...p, startDate: '' }));
                    }}
                    minDate={new Date()}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select start date"
                    id="step-start-date"
                    className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy"
                    wrapperClassName="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5"
                         style={{ fontFamily: "'Inter', sans-serif" }}>End Date</label>
                  <DatePicker
                    selected={form.endDate ? new Date(form.endDate + 'T12:00:00') : null}
                    onChange={date => {
                      if (date) setForm(p => ({ ...p, endDate: toDateStr(date) }));
                      else setForm(p => ({ ...p, endDate: '' }));
                    }}
                    minDate={form.startDate ? new Date(form.startDate + 'T12:00:00') : new Date()}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select end date"
                    id="step-end-date"
                    className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy"
                    wrapperClassName="w-full"
                  />
                </div>
              </div>

              {tripDuration > 0 && (
                <div className="mt-4 bg-primary-50 rounded-lg px-4 py-3 text-center border border-primary-100">
                  <p className="text-sm text-primary font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {tripDuration} {tripDuration === 1 ? 'Day' : 'Days'}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {new Date(form.startDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' → '}
                    {new Date(form.endDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}

              {form.startDate && form.endDate && form.endDate < form.startDate && (
                <p className="text-danger text-xs mt-2 text-center flex items-center justify-center gap-1"
                   style={{ fontFamily: "'Inter', sans-serif" }}>
                  <AlertTriangle size={12} strokeWidth={1.5} />End date cannot be before start date
                </p>
              )}
            </div>
          )}

          {/* ───────────────── STEP 5 — Budget ───────────────── */}
          {step === 5 && (
            <div>
              <StepHeader Icon={Wallet} title="Set your budget" subtitle="We'll track your spending against this" />

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy font-bold text-lg"
                      style={{ fontFamily: "'Poppins', sans-serif" }}>₹</span>
                <input
                  type="number" autoFocus id="step-budget"
                  placeholder="10000" min="1" step="1"
                  className={inputCls(false) + ' pl-10 text-xl font-bold text-center'}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  value={form.budget}
                  onChange={e => { const v = e.target.value; if (v === '' || Number(v) >= 0) setForm(p => ({ ...p, budget: v })); }}
                  onKeyDown={handleKey}
                />
              </div>

              {form.budget !== '' && Number(form.budget) < 1 && (
                <p className="text-danger text-xs mt-2 text-center flex items-center justify-center gap-1"
                   style={{ fontFamily: "'Inter', sans-serif" }}>
                  <AlertTriangle size={12} strokeWidth={1.5} />Budget must be at least ₹1
                </p>
              )}

              {/* Quick-pick chips */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {[5000, 10000, 15000, 25000, 50000].map(amount => (
                  <button key={amount} type="button"
                    onClick={() => setForm(p => ({ ...p, budget: String(amount) }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-150
                      ${form.budget === String(amount)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'}`}
                    style={{ fontFamily: "'Inter', sans-serif" }}>
                    ₹{amount.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Trip summary */}
              {form.budget && Number(form.budget) > 0 && (
                <div className="mt-6 bg-bg rounded-xl p-4 border border-border">
                  <h3 className="text-sm font-bold text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Trip Summary
                  </h3>
                  <div className="space-y-2">
                    {[
                      ['Trip Name',   form.name],
                      ['Destination', form.destination],
                      ['Travel Mode', TRAVEL_MODES.find(m => m.id === form.travelMode)?.label],
                      ['Duration',    `${tripDuration} ${tripDuration === 1 ? 'day' : 'days'}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <span className="text-text-secondary">{k}</span>
                        <span className="text-navy font-medium">{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t border-border"
                         style={{ fontFamily: "'Inter', sans-serif" }}>
                      <span className="text-text-secondary font-medium">Budget</span>
                      <span className="text-primary font-bold text-base"
                            style={{ fontFamily: "'Poppins', sans-serif" }}>
                        ₹{Number(form.budget).toLocaleString()}
                      </span>
                    </div>
                    {tripDuration > 0 && (
                      <p className="text-xs text-text-muted text-right" style={{ fontFamily: "'Inter', sans-serif" }}>
                        ~₹{Math.round(Number(form.budget) / tripDuration).toLocaleString()}/day
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button type="button" onClick={prevStep} id="step-back"
                className="flex-1 py-3 rounded-lg border border-border text-text-secondary font-semibold text-sm hover:bg-border-light hover:text-navy transition-colors cursor-pointer bg-white"
                style={{ fontFamily: "'Inter', sans-serif" }}>
                ← Back
              </button>
            )}
            {step < 5 ? (
              <button type="button" onClick={nextStep} disabled={!canProceed()} id="step-next"
                className={`flex-1 py-3 rounded-lg font-semibold text-sm border-0 transition-all cursor-pointer
                  ${canProceed() ? 'bg-primary hover:bg-primary-dark text-white' : 'bg-border-light text-text-muted cursor-not-allowed'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}>
                Next →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={!canProceed() || loading} id="step-submit"
                className={`flex-1 py-3 rounded-lg font-semibold text-sm border-0 transition-all cursor-pointer
                  ${canProceed() && !loading ? 'bg-accent hover:bg-accent-dark text-white' : 'bg-border-light text-text-muted cursor-not-allowed'}`}
                style={{ fontFamily: "'Inter', sans-serif", boxShadow: canProceed() && !loading ? '0 4px 12px rgba(255,107,53,0.35)' : 'none' }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </span>
                  : 'Create Itinerary'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}