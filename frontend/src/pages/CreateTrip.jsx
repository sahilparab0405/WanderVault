import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

/* ═══════════════════════════════════════
   Step Configuration
   ═══════════════════════════════════════ */

const STEPS = [
  { number: 1, label: 'Trip Name', icon: '✏️' },
  { number: 2, label: 'Destination', icon: '📍' },
  { number: 3, label: 'Travel Mode', icon: '🚀' },
  { number: 4, label: 'Dates', icon: '📅' },
  { number: 5, label: 'Budget', icon: '💰' },
];

const TRAVEL_MODES = [
  { id: 'flight', label: 'Flight', icon: '✈️', description: 'By air' },
  { id: 'train', label: 'Train', icon: '🚂', description: 'By rail' },
  { id: 'bus', label: 'Bus', icon: '🚌', description: 'By road' },
  { id: 'car', label: 'Car', icon: '🚗', description: 'Self drive' },
];

/* ═══════════════════════════════════════
   Nominatim Location Search Hook
   ═══════════════════════════════════════ */

function useLocationSearch() {
  const [query, setQuery] = useState('');
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
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );
        const data = await response.json();
        setSuggestions(
          data.map((item) => ({
            displayName: item.display_name,
            name: item.name || item.display_name.split(',')[0],
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: item.type,
            country: item.address?.country || '',
            state: item.address?.state || '',
          }))
        );
      } catch (err) {
        console.error('Nominatim search failed:', err);
        setSuggestions([]);
      }
      setIsSearching(false);
    }, 400);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setIsSearching(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { query, setQuery, suggestions, setSuggestions, isSearching, search, clear };
}

/* ═══════════════════════════════════════
   Progress Bar Component
   ═══════════════════════════════════════ */

function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div className="mb-8">
      {/* Step indicators */}
      <div className="flex items-center justify-between relative">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isUpcoming = currentStep < step.number;

          return (
            <div key={step.number} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
              {/* Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  transition-all duration-300 border-2
                  ${isCompleted
                    ? 'bg-primary border-primary text-white'
                    : isCurrent
                      ? 'bg-white border-primary text-primary'
                      : 'bg-white border-border text-text-muted'
                  }
                `}
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              {/* Label — hidden on mobile */}
              <span
                className={`mt-1.5 text-xs font-medium hidden sm:block transition-colors duration-300
                  ${isCurrent ? 'text-primary' : isCompleted ? 'text-navy' : 'text-text-muted'}
                `}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {step.label}
              </span>
            </div>
          );
        })}

        {/* Connecting lines */}
        <div className="absolute top-5 left-0 right-0 flex" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
          {STEPS.slice(0, -1).map((step, index) => (
            <div
              key={index}
              className="h-0.5 flex-1 transition-all duration-500 mx-1"
              style={{
                backgroundColor: currentStep > step.number + 1
                  ? 'var(--color-primary)'
                  : currentStep > step.number
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Main CreateTrip Component
   ═══════════════════════════════════════ */

export default function CreateTrip() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    destination: '',
    latitude: null,
    longitude: null,
    travelMode: '',
    startDate: '',
    endDate: '',
    budget: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Location search
  const locationSearch = useLocationSearch();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ─── Validation ─── */
  const canProceed = () => {
    switch (step) {
      case 1: return form.name.trim().length >= 2;
      case 2: return form.destination.trim().length >= 2;
      case 3: return form.travelMode !== '';
      case 4: return form.startDate !== '' && form.endDate !== '' && form.endDate >= form.startDate;
      case 5: return form.budget !== '' && Number(form.budget) > 0;
      default: return false;
    }
  };

  /* ─── Navigation ─── */
  const nextStep = () => {
    if (canProceed() && step < 5) {
      setStep(step + 1);
      setError('');
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    if (!canProceed()) return;
    setLoading(true);
    setError('');
    try {
      await API.post('/trips', {
        name: form.name.trim(),
        destination: form.destination.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        travelMode: form.travelMode,
        startDate: form.startDate,
        endDate: form.endDate,
        budget: Number(form.budget),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip. Please try again.');
    }
    setLoading(false);
  };

  /* ─── Location select handler ─── */
  const handleLocationSelect = (suggestion) => {
    setForm({
      ...form,
      destination: suggestion.name + (suggestion.country ? `, ${suggestion.country}` : ''),
      latitude: suggestion.lat,
      longitude: suggestion.lon,
    });
    locationSearch.setQuery(suggestion.name + (suggestion.country ? `, ${suggestion.country}` : ''));
    locationSearch.setSuggestions([]);
    setShowSuggestions(false);
  };

  /* ─── Keyboard handler for step navigation ─── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step < 5 && canProceed()) {
        nextStep();
      } else if (step === 5 && canProceed()) {
        handleSubmit();
      }
    }
  };

  /* ─── Calculate trip duration ─── */
  const tripDuration = form.startDate && form.endDate
    ? Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">

        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-text-secondary hover:text-navy text-sm no-underline transition-colors duration-150 mb-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl font-bold text-navy"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Plan Your Trip
          </h1>
          <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
            Step {step} of 5 — {STEPS[step - 1].label}
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={step} totalSteps={5} />

        {/* Card Container */}
        <div
          className="bg-card rounded-xl p-6 sm:p-8 border border-border"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {/* Error display */}
          {error && (
            <div
              className="bg-danger-light text-danger p-3 rounded-lg mb-5 text-sm font-medium border border-danger/20"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {error}
            </div>
          )}

          {/* ═══ STEP 1: Trip Name ═══ */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">✏️</span>
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  What's your trip called?
                </h2>
                <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Give your trip a memorable name
                </p>
              </div>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Goa Summer Trip"
                id="step-trip-name"
                className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy text-center"
                style={{ fontFamily: "'Inter', sans-serif" }}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={handleKeyDown}
                maxLength={60}
              />
              {form.name.trim().length > 0 && form.name.trim().length < 2 && (
                <p className="text-warning text-xs mt-2 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Name must be at least 2 characters
                </p>
              )}
            </div>
          )}

          {/* ═══ STEP 2: Destination ═══ */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">📍</span>
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Where are you headed?
                </h2>
                <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Search for your destination city or place
                </p>
              </div>

              <div className="relative">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    autoFocus
                    placeholder="Search — e.g. Goa, Manali, Paris..."
                    id="step-destination"
                    className="w-full border border-border rounded-lg pl-10 pr-10 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    value={locationSearch.query || form.destination}
                    onChange={(e) => {
                      locationSearch.search(e.target.value);
                      setForm({ ...form, destination: e.target.value, latitude: null, longitude: null });
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      if (locationSearch.suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                  />
                  {/* Loading spinner */}
                  {locationSearch.isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {/* Clear button */}
                  {!locationSearch.isSearching && form.destination && (
                    <button
                      onClick={() => {
                        locationSearch.clear();
                        setForm({ ...form, destination: '', latitude: null, longitude: null });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy cursor-pointer bg-transparent border-0 p-0 text-lg leading-none"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && locationSearch.suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg overflow-hidden z-20"
                    style={{ boxShadow: 'var(--shadow-lg)' }}
                  >
                    {locationSearch.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLocationSelect(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors duration-100 cursor-pointer bg-transparent border-0 border-b border-border-light last:border-b-0 flex items-start gap-3"
                        id={`suggestion-${idx}`}
                      >
                        <span className="text-accent mt-0.5 shrink-0">📍</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-navy truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {suggestion.name}
                          </p>
                          <p className="text-xs text-text-muted truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {suggestion.displayName}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected location confirmation */}
              {form.latitude && form.longitude && (
                <div className="mt-3 flex items-center gap-2 text-success text-sm bg-success-light px-3 py-2 rounded-lg"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Location selected — {form.destination}
                </div>
              )}

              <p className="text-text-muted text-xs mt-3 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                Powered by OpenStreetMap • You can also type a location manually
              </p>
            </div>
          )}

          {/* ═══ STEP 3: Travel Mode ═══ */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">🚀</span>
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  How are you traveling?
                </h2>
                <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Select your primary mode of transport
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TRAVEL_MODES.map((mode) => {
                  const isSelected = form.travelMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setForm({ ...form, travelMode: mode.id })}
                      id={`travel-mode-${mode.id}`}
                      className={`
                        p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 bg-white
                        flex flex-col items-center gap-2 
                        ${isSelected
                          ? 'border-accent bg-accent-50'
                          : 'border-border hover:border-primary-100 hover:bg-primary-50'
                        }
                      `}
                      style={{ boxShadow: isSelected ? '0 0 0 1px var(--color-accent)' : 'none' }}
                    >
                      <span className="text-4xl">{mode.icon}</span>
                      <span
                        className={`text-sm font-bold ${isSelected ? 'text-accent-dark' : 'text-navy'}`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {mode.label}
                      </span>
                      <span
                        className={`text-xs ${isSelected ? 'text-accent' : 'text-text-muted'}`}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {mode.description}
                      </span>
                      {/* Checkmark badge */}
                      {isSelected && (
                        <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center mt-1">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ STEP 4: Dates ═══ */}
          {step === 4 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">📅</span>
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  When are you going?
                </h2>
                <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Pick your travel dates
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium text-navy mb-1.5"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    autoFocus
                    id="step-start-date"
                    className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    value={form.startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setForm({ ...form, startDate: e.target.value });
                      // Reset end date if it's before new start date
                      if (form.endDate && e.target.value > form.endDate) {
                        setForm(prev => ({ ...prev, startDate: e.target.value, endDate: '' }));
                      }
                    }}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-navy mb-1.5"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    id="step-end-date"
                    className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    value={form.endDate}
                    min={form.startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              {/* Duration summary */}
              {tripDuration > 0 && (
                <div className="mt-4 bg-primary-50 rounded-lg px-4 py-3 text-center border border-primary-100">
                  <p className="text-sm text-primary font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {tripDuration} {tripDuration === 1 ? 'Day' : 'Days'} Trip
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {new Date(form.startDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' → '}
                    {new Date(form.endDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}

              {/* Validation message */}
              {form.startDate && form.endDate && form.endDate < form.startDate && (
                <p className="text-danger text-xs mt-2 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                  End date cannot be before start date
                </p>
              )}
            </div>
          )}

          {/* ═══ STEP 5: Budget ═══ */}
          {step === 5 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">💰</span>
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Set your budget
                </h2>
                <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  We'll help you track spending against this
                </p>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy font-bold text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>₹</span>
                <input
                  type="number"
                  autoFocus
                  placeholder="10000"
                  id="step-budget"
                  className="w-full border border-border rounded-lg pl-10 pr-4 py-3 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  value={form.budget}
                  min="1"
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* Quick amount buttons */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {[5000, 10000, 15000, 25000, 50000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setForm({ ...form, budget: String(amount) })}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-150
                      ${form.budget === String(amount)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'
                      }
                    `}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    ₹{amount.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Trip Summary Preview */}
              {form.budget && Number(form.budget) > 0 && (
                <div className="mt-6 bg-bg rounded-xl p-4 border border-border">
                  <h3 className="text-sm font-bold text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Trip Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <span className="text-text-secondary">Trip Name</span>
                      <span className="text-navy font-medium">{form.name}</span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <span className="text-text-secondary">Destination</span>
                      <span className="text-navy font-medium">{form.destination}</span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <span className="text-text-secondary">Travel Mode</span>
                      <span className="text-navy font-medium">
                        {TRAVEL_MODES.find(m => m.id === form.travelMode)?.icon}{' '}
                        {TRAVEL_MODES.find(m => m.id === form.travelMode)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <span className="text-text-secondary">Duration</span>
                      <span className="text-navy font-medium">{tripDuration} {tripDuration === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-border" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <span className="text-text-secondary font-medium">Budget</span>
                      <span className="text-primary font-bold text-base" style={{ fontFamily: "'Poppins', sans-serif" }}>
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

          {/* ═══ Navigation Buttons ═══ */}
          <div className="flex gap-3 mt-8">
            {/* Back button */}
            {step > 1 && (
              <button
                onClick={prevStep}
                id="step-back"
                className="flex-1 py-3 rounded-lg border border-border text-text-secondary font-semibold text-sm
                           hover:bg-border-light hover:text-navy transition-colors duration-150 cursor-pointer bg-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                ← Back
              </button>
            )}

            {/* Next / Submit button */}
            {step < 5 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                id="step-next"
                className={`
                  flex-1 py-3 rounded-lg font-semibold text-sm border-0 transition-all duration-150 cursor-pointer
                  ${canProceed()
                    ? 'bg-primary hover:bg-primary-dark text-white'
                    : 'bg-border-light text-text-muted cursor-not-allowed'
                  }
                `}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                id="step-submit"
                className={`
                  flex-1 py-3 rounded-lg font-semibold text-sm border-0 transition-all duration-150 cursor-pointer
                  ${canProceed() && !loading
                    ? 'bg-accent hover:bg-accent-dark text-white'
                    : 'bg-border-light text-text-muted cursor-not-allowed'
                  }
                `}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Trip 🚀'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}