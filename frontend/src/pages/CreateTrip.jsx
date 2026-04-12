import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Pen, MapPin, Navigation, Calendar, Wallet, Plane, Train, Bus, Car, Search, AlertTriangle } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Trip Name',   Icon: Pen },
  { number: 2, label: 'Destination', Icon: MapPin },
  { number: 3, label: 'Travel Mode', Icon: Navigation },
  { number: 4, label: 'Dates',       Icon: Calendar },
  { number: 5, label: 'Budget',      Icon: Wallet },
];

const TRAVEL_MODES = [
  { id: 'flight', label: 'Flight', Icon: Plane,  description: 'By air' },
  { id: 'train',  label: 'Train',  Icon: Train,  description: 'By rail' },
  { id: 'bus',    label: 'Bus',    Icon: Bus,    description: 'By road' },
  { id: 'car',    label: 'Car',    Icon: Car,    description: 'Self drive' },
];

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
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setSuggestions(data.map(item => ({ displayName: item.display_name, name: item.name || item.display_name.split(',')[0], lat: parseFloat(item.lat), lon: parseFloat(item.lon), country: item.address?.country || '' })));
      } catch { setSuggestions([]); }
      setIsSearching(false);
    }, 400);
  }, []);

  const clear = useCallback(() => { setQuery(''); setSuggestions([]); setIsSearching(false); if (debounceRef.current) clearTimeout(debounceRef.current); }, []);
  return { query, setQuery, suggestions, setSuggestions, isSearching, search, clear };
}

function ProgressBar({ currentStep }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {STEPS.map((step) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          return (
            <div key={step.number} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 ${isCompleted ? 'bg-primary border-primary text-white' : isCurrent ? 'bg-white border-primary text-primary' : 'bg-white border-border text-text-muted'}`} style={{ fontFamily: "'Poppins', sans-serif" }}>
                {isCompleted ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : step.number}
              </div>
              <span className={`mt-1.5 text-xs font-medium hidden sm:block transition-colors duration-300 ${isCurrent ? 'text-primary' : isCompleted ? 'text-navy' : 'text-text-muted'}`} style={{ fontFamily: "'Inter', sans-serif" }}>{step.label}</span>
            </div>
          );
        })}
        <div className="absolute top-5 left-0 right-0 flex" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
          {STEPS.slice(0, -1).map((step, index) => (
            <div key={index} className="h-0.5 flex-1 transition-all duration-500 mx-1" style={{ backgroundColor: currentStep > step.number ? 'var(--color-primary)' : 'var(--color-border)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CreateTrip() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', destination: '', latitude: null, longitude: null, travelMode: '', startDate: '', endDate: '', budget: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const locationSearch = useLocationSearch();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) setShowSuggestions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const nextStep = () => { if (canProceed() && step < 5) { setStep(step + 1); setError(''); } };
  const prevStep = () => { if (step > 1) { setStep(step - 1); setError(''); } };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setLoading(true); setError('');
    try {
      await API.post('/trips', { name: form.name.trim(), destination: form.destination.trim(), latitude: form.latitude, longitude: form.longitude, travelMode: form.travelMode, startDate: form.startDate, endDate: form.endDate, budget: Number(form.budget) });
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Failed to create trip. Please try again.'); }
    setLoading(false);
  };

  const handleLocationSelect = (s) => {
    const dest = s.name + (s.country ? `, ${s.country}` : '');
    setForm({ ...form, destination: dest, latitude: s.lat, longitude: s.lon });
    locationSearch.setQuery(dest); locationSearch.setSuggestions([]); setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (step < 5 && canProceed()) nextStep(); else if (step === 5 && canProceed()) handleSubmit(); }
  };

  const tripDuration = form.startDate && form.endDate ? Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 0;

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-text-secondary hover:text-navy text-sm no-underline transition-colors duration-150 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>← Back to Dashboard</Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Plan Your Trip</h1>
          <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Step {step} of 5 — {STEPS[step - 1].label}</p>
        </div>
        <ProgressBar currentStep={step} />
        <div className="bg-card rounded-xl p-6 sm:p-8 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
          {error && (
            <div className="bg-danger-light text-danger p-3 rounded-lg mb-5 text-sm font-medium border border-danger/20 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              <AlertTriangle size={16} strokeWidth={1.5} />{error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3"><div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary"><Pen size={24} strokeWidth={1.5} /></div></div>
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>What's your trip called?</h2>
                <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Give your trip a memorable name</p>
              </div>
              <input type="text" autoFocus placeholder="e.g. Goa Summer Trip" id="step-trip-name" className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy text-center" style={{ fontFamily: "'Inter', sans-serif" }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onKeyDown={handleKeyDown} maxLength={60} />
              {form.name.trim().length > 0 && form.name.trim().length < 2 && <p className="text-danger text-xs mt-2 text-center flex items-center justify-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}><AlertTriangle size={12} strokeWidth={1.5} />Name must be at least 2 characters</p>}
              {form.name.trim().length >= 2 && <p className="text-success text-xs mt-2 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>Looks good</p>}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3"><div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary"><MapPin size={24} strokeWidth={1.5} /></div></div>
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Where are you headed?</h2>
                <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Search for your destination city or place</p>
              </div>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} strokeWidth={1.5} />
                  <input ref={inputRef} type="text" autoFocus placeholder="Search — e.g. Goa, Manali, Paris..." id="step-destination" className="w-full border border-border rounded-lg pl-10 pr-10 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy" style={{ fontFamily: "'Inter', sans-serif" }} value={locationSearch.query || form.destination} onChange={(e) => { locationSearch.search(e.target.value); setForm({ ...form, destination: e.target.value, latitude: null, longitude: null }); setShowSuggestions(true); }} onFocus={() => { if (locationSearch.suggestions.length > 0) setShowSuggestions(true); }} onKeyDown={handleKeyDown} />
                  {locationSearch.isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
                  {!locationSearch.isSearching && form.destination && <button onClick={() => { locationSearch.clear(); setForm({ ...form, destination: '', latitude: null, longitude: null }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy cursor-pointer bg-transparent border-0 p-0 text-lg leading-none" aria-label="Clear search">×</button>}
                </div>
                {showSuggestions && locationSearch.suggestions.length > 0 && (
                  <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg overflow-hidden z-20" style={{ boxShadow: 'var(--shadow-lg)' }}>
                    {locationSearch.suggestions.map((s, idx) => (
                      <button key={idx} onClick={() => handleLocationSelect(s)} className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors duration-100 cursor-pointer bg-transparent border-0 border-b border-border-light last:border-b-0 flex items-start gap-3" id={`suggestion-${idx}`}>
                        <MapPin size={16} strokeWidth={1.5} className="text-accent mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-navy truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{s.name}</p>
                          <p className="text-xs text-text-muted truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{s.displayName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.latitude && form.longitude && (
                <div className="mt-3 flex items-center gap-2 text-success text-sm bg-success-light px-3 py-2 rounded-lg" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Location selected — {form.destination}
                </div>
              )}
              <p className="text-text-muted text-xs mt-3 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>Powered by OpenStreetMap. You can also type a location manually.</p>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3"><div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary"><Navigation size={24} strokeWidth={1.5} /></div></div>
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>How are you traveling?</h2>
                <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Select your primary mode of transport</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {TRAVEL_MODES.map((mode) => {
                  const isSelected = form.travelMode === mode.id;
                  const ModeIcon = mode.Icon;
                  return (
                    <button key={mode.id} onClick={() => setForm({ ...form, travelMode: mode.id })} id={`travel-mode-${mode.id}`}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 bg-white flex flex-col items-center gap-3 ${isSelected ? 'border-accent bg-accent-50' : 'border-border hover:border-primary-100 hover:bg-primary-50'}`}
                      style={{ boxShadow: isSelected ? '0 0 0 1px var(--color-accent)' : 'none' }}>
                      <ModeIcon size={32} strokeWidth={1.5} color={isSelected ? '#FF6B35' : '#2563EB'} />
                      <span className={`text-sm font-bold ${isSelected ? 'text-accent-dark' : 'text-navy'}`} style={{ fontFamily: "'Poppins', sans-serif" }}>{mode.label}</span>
                      <span className={`text-xs ${isSelected ? 'text-accent' : 'text-text-muted'}`} style={{ fontFamily: "'Inter', sans-serif" }}>{mode.description}</span>
                      {isSelected && <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3"><div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary"><Calendar size={24} strokeWidth={1.5} /></div></div>
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>When are you going?</h2>
                <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Pick your travel dates</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>Start Date</label>
                  <DatePicker selected={form.startDate ? new Date(form.startDate + 'T12:00:00') : null} onChange={(date) => { if (date) { const s = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; if (form.endDate && s > form.endDate) setForm(p => ({...p, startDate: s, endDate: ''})); else setForm({ ...form, startDate: s }); } else setForm({ ...form, startDate: '' }); }} minDate={new Date()} dateFormat="yyyy-MM-dd" placeholderText="Select start date" id="step-start-date" className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy" wrapperClassName="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>End Date</label>
                  <DatePicker selected={form.endDate ? new Date(form.endDate + 'T12:00:00') : null} onChange={(date) => { if (date) { const s = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; setForm({ ...form, endDate: s }); } else setForm({ ...form, endDate: '' }); }} minDate={form.startDate ? new Date(form.startDate + 'T12:00:00') : new Date()} dateFormat="yyyy-MM-dd" placeholderText="Select end date" id="step-end-date" className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy" wrapperClassName="w-full" />
                </div>
              </div>
              {tripDuration > 0 && (
                <div className="mt-4 bg-primary-50 rounded-lg px-4 py-3 text-center border border-primary-100">
                  <p className="text-sm text-primary font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>{tripDuration} {tripDuration === 1 ? 'Day' : 'Days'} Trip</p>
                  <p className="text-xs text-text-secondary mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{new Date(form.startDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} → {new Date(form.endDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
              )}
              {form.startDate && form.endDate && form.endDate < form.startDate && <p className="text-danger text-xs mt-2 text-center flex items-center justify-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}><AlertTriangle size={12} strokeWidth={1.5} />End date cannot be before start date</p>}
              {form.startDate && !form.endDate && <p className="text-text-muted text-xs mt-2 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>Now select your return date</p>}
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3"><div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary"><Wallet size={24} strokeWidth={1.5} /></div></div>
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Set your budget</h2>
                <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>We'll help you track spending against this</p>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy font-bold text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>₹</span>
                <input type="number" autoFocus placeholder="10000" id="step-budget" className="w-full border border-border rounded-lg pl-10 pr-4 py-3 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy" style={{ fontFamily: "'Poppins', sans-serif" }} value={form.budget} min="1" step="1" onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) setForm({ ...form, budget: v }); }} onKeyDown={handleKeyDown} />
              </div>
              {form.budget !== '' && Number(form.budget) < 1 && <p className="text-danger text-xs mt-2 text-center flex items-center justify-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}><AlertTriangle size={12} strokeWidth={1.5} />Budget must be at least ₹1</p>}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {[5000, 10000, 15000, 25000, 50000].map((amount) => (
                  <button key={amount} onClick={() => setForm({ ...form, budget: String(amount) })} className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-150 ${form.budget === String(amount) ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'}`} style={{ fontFamily: "'Inter', sans-serif" }}>₹{amount.toLocaleString()}</button>
                ))}
              </div>
              {form.budget && Number(form.budget) > 0 && (
                <div className="mt-6 bg-bg rounded-xl p-4 border border-border">
                  <h3 className="text-sm font-bold text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Trip Summary</h3>
                  <div className="space-y-2">
                    {[['Trip Name', form.name], ['Destination', form.destination], ['Travel Mode', TRAVEL_MODES.find(m => m.id === form.travelMode)?.label], ['Duration', `${tripDuration} ${tripDuration === 1 ? 'day' : 'days'}`]].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm" style={{ fontFamily: "'Inter', sans-serif" }}><span className="text-text-secondary">{k}</span><span className="text-navy font-medium">{v}</span></div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t border-border" style={{ fontFamily: "'Inter', sans-serif" }}><span className="text-text-secondary font-medium">Budget</span><span className="text-primary font-bold text-base" style={{ fontFamily: "'Poppins', sans-serif" }}>₹{Number(form.budget).toLocaleString()}</span></div>
                    {tripDuration > 0 && <p className="text-xs text-text-muted text-right" style={{ fontFamily: "'Inter', sans-serif" }}>~₹{Math.round(Number(form.budget) / tripDuration).toLocaleString()}/day</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && <button onClick={prevStep} id="step-back" className="flex-1 py-3 rounded-lg border border-border text-text-secondary font-semibold text-sm hover:bg-border-light hover:text-navy transition-colors duration-150 cursor-pointer bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>← Back</button>}
            {step < 5 ? (
              <button onClick={nextStep} disabled={!canProceed()} id="step-next" className={`flex-1 py-3 rounded-lg font-semibold text-sm border-0 transition-all duration-150 cursor-pointer ${canProceed() ? 'bg-primary hover:bg-primary-dark text-white' : 'bg-border-light text-text-muted cursor-not-allowed'}`} style={{ fontFamily: "'Inter', sans-serif" }}>Next →</button>
            ) : (
              <button onClick={handleSubmit} disabled={!canProceed() || loading} id="step-submit" className={`flex-1 py-3 rounded-lg font-semibold text-sm border-0 transition-all duration-150 cursor-pointer ${canProceed() && !loading ? 'bg-accent hover:bg-accent-dark text-white' : 'bg-border-light text-text-muted cursor-not-allowed'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</span> : 'Create Itinerary'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}