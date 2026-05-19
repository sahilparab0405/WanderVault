import React from 'react';
import { Pen, MapPin, Search, X, Navigation, Calendar, Building2, Wallet, Wifi, Bath, Flame, ParkingCircle, Star, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import DatePicker from 'react-datepicker';
import BudgetScoreCard from '../BudgetScoreCard';

// eslint-disable-next-line no-unused-vars
export const StepHeader = ({ Icon, title, subtitle }) => (
  <div className="text-center mb-6">
    <div className="flex justify-center mb-3">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
        <Icon size={24} strokeWidth={1.5} />
      </div>
    </div>
    <h2 className="text-lg sm:text-xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h2>
    {subtitle && <p className="text-text-secondary text-xs sm:text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>{subtitle}</p>}
  </div>
);

export const CheckCircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Step1TripName({ form, setForm, handleKey, inputCls }) {
  return (
    <div>
      <StepHeader Icon={Pen} title="What's your trip called?" subtitle="Give your trip a memorable name" />
      <input type="text" autoFocus placeholder="e.g. Goa Summer Trip" className={inputCls(false) + ' text-center'} style={{ fontFamily: "'Inter', sans-serif" }} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} onKeyDown={handleKey} maxLength={60} />
    </div>
  );
}

export function Step2Destination({ form, setForm, locationSearch, inputRef, showSuggestions, setShowSuggestions, suggestionsRef, handleLocationSelect, handleKey, inputCls }) {
  return (
    <div>
      <StepHeader Icon={MapPin} title="Where are you headed?" subtitle="Search for a city or destination" />
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={17} strokeWidth={1.5} />
          <input ref={inputRef} type="text" autoFocus placeholder="Search — e.g. Goa, Manali, Paris..." className={inputCls(false) + ' pl-10 pr-10'} style={{ fontFamily: "'Inter', sans-serif" }} value={locationSearch.query || form.destination} onChange={e => { locationSearch.search(e.target.value); setForm(p => ({ ...p, destination: e.target.value, latitude: null, longitude: null })); setShowSuggestions(true); }} onFocus={() => { if (locationSearch.suggestions.length) setShowSuggestions(true); }} onKeyDown={handleKey} />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {locationSearch.isSearching ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-xl animate-spin" /> : form.destination ? <button type="button" onClick={() => { locationSearch.clear(); setForm(p => ({ ...p, destination: '', latitude: null, longitude: null })); }} className="text-text-muted hover:text-navy cursor-pointer bg-transparent border-0 p-0 flex items-center"><X size={15} strokeWidth={2} /></button> : null}
          </div>
        </div>
        {showSuggestions && locationSearch.suggestions.length > 0 && (
          <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl overflow-hidden z-30" style={{ boxShadow: 'var(--shadow-lg)' }}>
            {locationSearch.suggestions.map((s, idx) => (
              <button key={idx} type="button" onClick={() => handleLocationSelect(s)} className="w-full text-left px-6 py-3 hover:bg-primary-50 transition-colors border-0 border-b border-border-light last:border-b-0 bg-transparent flex items-start gap-3 cursor-pointer">
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
  );
}

export function BookingPanel({ modeId, bookingData, onChange, onSkip, BOOKING_CONFIG }) {
  const [expanded, setExpanded] = React.useState(false);
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
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl border border-navy text-navy text-xs font-semibold no-underline hover:bg-navy hover:text-white transition-all duration-150" style={{ fontFamily: "'Inter', sans-serif" }}>
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
            <div className="mt-3 bg-bg rounded-xl p-6 border border-border space-y-3">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Booking Details <span className="text-text-muted font-normal normal-case">(optional)</span></p>
              {config.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>{field.label} {field.required && <span className="text-danger ml-0.5">*</span>}</label>
                  <input type={field.type || 'text'} placeholder={field.placeholder} value={bookingData?.[field.key] || ''} onChange={e => handleField(field.key, e.target.value)} className="w-full border border-border rounded-xl px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy transition-colors" style={{ fontFamily: "'Inter', sans-serif" }} />
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

export function Step3TravelMode({ form, setForm, TRAVEL_MODES, BOOKING_CONFIG, nextStep }) {
  return (
    <div>
      <StepHeader Icon={Navigation} title="How are you traveling?" subtitle="Select your primary mode of transport" />
      <div className="grid grid-cols-4 gap-3 mb-4">
        {TRAVEL_MODES.map(mode => {
          const isSelected = form.travelMode === mode.id;
          const MIcon = mode.Icon;
          return (
            <button key={mode.id} type="button" onClick={() => setForm(p => ({ ...p, travelMode: mode.id, bookingDetails: {} }))} className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 cursor-pointer transition-all duration-200 bg-white ${isSelected ? 'border-accent shadow-md' : 'border-border hover:border-primary/40 hover:bg-primary-50'}`} style={{ boxShadow: isSelected ? '0 0 0 1px #FF6B35' : 'none' }}>
              <MIcon size={28} strokeWidth={1.5} color={isSelected ? '#FF6B35' : '#2563EB'} />
              <span className={`text-xs font-bold ${isSelected ? 'text-accent' : 'text-navy'}`} style={{ fontFamily: "'Poppins', sans-serif" }}>{mode.label}</span>
            </button>
          );
        })}
      </div>
      {form.travelMode && (
        <div className="border-t border-border pt-6">
          <BookingPanel modeId={form.travelMode} bookingData={form.bookingDetails} onChange={d => setForm(p => ({ ...p, bookingDetails: d }))} onSkip={() => nextStep()} BOOKING_CONFIG={BOOKING_CONFIG} />
        </div>
      )}
    </div>
  );
}

export function Step4Dates({ form, setForm, toDateStr, totalDays }) {
  return (
    <div>
      <StepHeader Icon={Calendar} title="When are you going?" subtitle="Pick your travel dates" />
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>Start Date</label>
          <DatePicker selected={form.startDate ? new Date(form.startDate + 'T12:00:00') : null} onChange={date => { if (date) { const s = toDateStr(date); setForm(p => ({ ...p, startDate: s, endDate: (p.endDate && s > p.endDate) ? '' : p.endDate })); } else setForm(p => ({ ...p, startDate: '' })); }} minDate={new Date()} dateFormat="yyyy-MM-dd" placeholderText="Select start date" className="w-full border border-border rounded-xl px-6 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy" wrapperClassName="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>End Date</label>
          <DatePicker selected={form.endDate ? new Date(form.endDate + 'T12:00:00') : null} onChange={date => setForm(p => ({ ...p, endDate: date ? toDateStr(date) : '' }))} minDate={form.startDate ? new Date(form.startDate + 'T12:00:00') : new Date()} dateFormat="yyyy-MM-dd" placeholderText="Select end date" className="w-full border border-border rounded-xl px-6 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-navy" wrapperClassName="w-full" />
        </div>
      </div>
      {totalDays > 0 && <div className="mt-4 bg-primary-50 rounded-xl px-6 py-3 text-center border border-primary-100"><p className="text-sm text-primary font-bold">{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</p></div>}
    </div>
  );
}

export function Step5Accommodation({ form, accMode, setAccMode, accForm, setAccForm, hotels, hotelsLoading, renderExternalLinks, saveAccommodation, nextStep, toDateStr, totalDays }) {
  return (
    <div>
      <StepHeader Icon={Building2} title="Where are you staying?" subtitle="Let's add your accommodation details" />
      
      {!accMode && form.accommodation.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-bold text-navy mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Saved Accommodations</h4>
          <div className="space-y-2">
            {form.accommodation.map((acc, i) => (
              <div key={i} className="bg-success-light border border-success/30 p-6 rounded-xl flex items-center justify-between">
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
          <button type="button" onClick={() => setAccMode('browse')} className="w-full bg-white border-2 border-border hover:border-primary/40 hover:bg-primary-50 text-navy font-bold py-3 rounded-xl transition-all duration-150 cursor-pointer text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Search Hotels Near Destination</button>
          <button type="button" onClick={() => setAccMode('booked')} className="w-full bg-white border-2 border-border hover:border-accent/40 hover:bg-accent-50 text-navy font-bold py-3 rounded-xl transition-all duration-150 cursor-pointer text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Already Booked? Add Details</button>
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
            <div className="py-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-xl animate-spin mx-auto" /></div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-3 text-sm text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>No hotels found for this location.</div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {hotels.map((h, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-border flex flex-col sm:flex-row group" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="w-full sm:w-32 h-32 shrink-0 relative flex items-center justify-center bg-border-light overflow-hidden">
                    <div className="absolute inset-0 w-full h-full" style={{ background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' }}></div>
                    <img src={h.image} alt={h.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-navy text-sm line-clamp-1 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>{h.name}</h4>
                        <div className="flex items-center gap-0.5 bg-success text-white px-1.5 rounded-xl text-[10px] font-bold"><Star size={8} fill="#fff" strokeWidth={0}/> {h.rating}</div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-text-secondary">
                        {[{Icon:Wifi, l:'Wifi'}, {Icon:Bath, l:'Tub'}, {Icon:Flame, l:'BBQ'}, {Icon:ParkingCircle, l:'Parking'}].slice(0, 3 + ((h.hash || 0)%2)).map((am, idx) => {
                          const AIcon = am.Icon; return <div key={idx} className="flex flex-col items-center gap-0.5"><AIcon size={12} strokeWidth={1.5} /><span className="text-[8px]">{am.l}</span></div>
                        })}
                      </div>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <p className="text-lg font-bold text-navy leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>₹{h.price.toLocaleString()}</p>
                        <p className="text-[9px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>per night • {h.distance} away</p>
                      </div>
                      <button type="button" onClick={() => { setAccForm(p => ({ ...p, name: h.name, pricePerNight: h.price })); setAccMode('booked'); }} className="bg-accent hover:bg-accent-dark text-white px-6 py-1.5 rounded-xl text-xs font-bold border-0 cursor-pointer transition-colors">Select</button>
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
        <div className="bg-bg rounded-xl p-6 border border-border mt-2 space-y-4">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Hotel Details</h4>
            <button type="button" onClick={() => setAccMode('')} className="text-xs text-primary font-semibold border-0 bg-transparent cursor-pointer">Cancel</button>
          </div>
          <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Hotel Name *</label><input type="text" placeholder="e.g. Taj Hotel" value={accForm.name} onChange={e => setAccForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-border rounded-xl px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Check-in Date</label><DatePicker selected={accForm.checkIn ? new Date(accForm.checkIn+'T12:00:00') : null} onChange={d => setAccForm(p => ({...p, checkIn: d ? toDateStr(d) : ''}))} dateFormat="yyyy-MM-dd" className="w-full border border-border rounded-xl px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholderText="Check-in" wrapperClassName="w-full" /></div>
            <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Check-out Date</label><DatePicker selected={accForm.checkOut ? new Date(accForm.checkOut+'T12:00:00') : null} onChange={d => setAccForm(p => ({...p, checkOut: d ? toDateStr(d) : ''}))} dateFormat="yyyy-MM-dd" className="w-full border border-border rounded-xl px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholderText="Check-out" wrapperClassName="w-full" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>From Day</label><input type="number" min="1" placeholder="1" value={accForm.fromDay} onChange={e => setAccForm(p => ({ ...p, fromDay: e.target.value }))} className="w-full border border-border rounded-xl px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>To Day</label><input type="number" min="1" placeholder={totalDays || 7} value={accForm.toDay} onChange={e => setAccForm(p => ({ ...p, toDay: e.target.value }))} className="w-full border border-border rounded-xl px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Price/Night (₹)</label><input type="number" min="0" placeholder="0" value={accForm.pricePerNight} onChange={e => setAccForm(p => ({ ...p, pricePerNight: e.target.value }))} className="w-full border border-border rounded-xl px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
          </div>
          <button type="button" onClick={saveAccommodation} disabled={!accForm.name.trim()} className="w-full bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm border-0 transition-all duration-150 cursor-pointer mt-2" style={{ boxShadow: accForm.name.trim() ? '0 4px 12px rgba(255,107,53,0.3)' : 'none' }}>Save Accommodation</button>
        </div>
      )}
    </div>
  );
}

export function Step6Budget({ form, setForm, handleKey, inputCls, totalDays }) {
  return (
    <div>
      <StepHeader Icon={Wallet} title="Set your budget" subtitle="We'll track your spending against this" />
      <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy font-bold text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>₹</span><input type="number" autoFocus placeholder="10000" min="1" step="1" className={inputCls(false) + ' pl-10 text-xl font-bold text-center'} style={{ fontFamily: "'Poppins', sans-serif" }} value={form.budget} onChange={e => { const v = e.target.value; if (v === '' || Number(v) >= 0) setForm(p => ({ ...p, budget: v })); }} onKeyDown={handleKey} /></div>
      <div className="flex flex-wrap gap-2 mt-4 justify-center">{[5000, 10000, 15000, 25000, 50000].map(amount => (<button key={amount} type="button" onClick={() => setForm(p => ({ ...p, budget: String(amount) }))} className={`px-6 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all duration-150 ${form.budget === String(amount) ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'}`} style={{ fontFamily: "'Inter', sans-serif" }}>₹{amount.toLocaleString()}</button>))}</div>
      {form.budget && <BudgetScoreCard budget={Number(form.budget)} days={totalDays || 1} destination={form.destination} />}
    </div>
  );
}
