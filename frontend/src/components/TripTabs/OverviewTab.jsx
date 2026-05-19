import React from 'react';
import { 
  Car, Plane, Train, Bus, Hotel, ArrowRight, MapPin, 
  Clock, DollarSign, Building, AlertTriangle, Compass, Utensils
} from 'lucide-react';

export default function OverviewTab({ trip, bookedHotel, handleTabChange }) {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 space-y-8">
          {/* Key Highlights Card */}
          <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
             <h3 className="text-xl font-black text-navy mb-8 flex items-center gap-2">
                <span className="text-primary">ℹ️</span> Trip Essentials
             </h3>
             <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Transport Status</p>
                   <div className="flex items-center gap-4">
                      {(() => {
                         let Icon = Car;
                         let title = 'Road Trip';
                         let subtitle = 'Self-commute mode active';
                         
                         if (trip.travelMode === 'flight') {
                            Icon = Plane;
                            title = 'Flight Booked';
                            subtitle = 'Air travel selected';
                         } else if (trip.travelMode === 'train') {
                            Icon = Train;
                            title = 'Train Journey';
                            subtitle = 'Rail travel selected';
                         } else if (trip.travelMode === 'bus') {
                            Icon = Bus;
                            title = 'Bus Travel';
                            subtitle = 'Roadway travel selected';
                         }

                         return (
                            <>
                               <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-inner">
                                  <Icon size={24} />
                               </div>
                               <div>
                                  <p className="font-black text-navy text-lg">{title}</p>
                                  <p className="text-[11px] text-text-secondary">{subtitle}</p>
                               </div>
                            </>
                         );
                      })()}
                   </div>
                </div>
                <div className="space-y-3">
                   <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Accommodation</p>
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${bookedHotel ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-600'} rounded-xl flex items-center justify-center shadow-inner`}>
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
                <button onClick={() => handleTabChange('itinerary')} className="flex-1 bg-navy text-white py-3 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-navy-dark transition-all border-0 cursor-pointer shadow-lg shadow-navy/20">
                   VIEW DAILY ITINERARY <ArrowRight size={18} />
                </button>
                <button onClick={() => handleTabChange('map')} className="flex-1 bg-bg border border-border text-navy py-3 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-white transition-all border-0 cursor-pointer">
                   OPEN INTERACTIVE MAP <MapPin size={18} />
                </button>
             </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid sm:grid-cols-3 gap-6">
             <div className="bg-white p-8 rounded-3xl border border-border shadow-sm text-center group hover:border-primary/50 transition-colors">
                <div className="w-14 h-14 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                   <Clock size={28} />
                </div>
                <p className="text-2xl font-black text-navy">{Math.ceil((new Date(trip.endDate) - new Date(trip.startDate))/(1000*60*60*24))} Days</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Duration</p>
             </div>
             <div className="bg-white p-8 rounded-3xl border border-border shadow-sm text-center group hover:border-success/50 transition-colors">
                <div className="w-14 h-14 bg-success/10 text-success rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                   <DollarSign size={28} />
                </div>
                <p className="text-2xl font-black text-navy">₹{Math.round(trip.totalExpense / Math.ceil((new Date(trip.endDate) - new Date(trip.startDate))/(1000*60*60*24)) || 1)}</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Daily Avg</p>
             </div>
             <div className="bg-white p-8 rounded-3xl border border-border shadow-sm text-center group hover:border-primary/50 transition-colors">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                   <Building size={28} />
                </div>
                <p className="text-2xl font-black text-navy">{trip.itinerary?.length || 0}</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Activities</p>
             </div>
          </div>
       </div>

       {/* Sidebar Col: Active Hotel + Map Preview */}
       <div className="space-y-8">
          <div className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm">
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
                      <div className="pt-6 flex gap-3">
                         {/* We will let the parent handle the modal for changing hotel, but since we extracted it, we need to pass a callback */}
                         <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('changeHotel', { detail: bookedHotel._id }))}
                            className="flex-1 bg-danger/5 hover:bg-danger text-danger hover:text-white py-3 rounded-xl text-xs font-black transition-all border-0 cursor-pointer"
                         >
                            Change Hotel
                         </button>
                         <a href={`https://www.google.com/maps/search/?api=1&query=${bookedHotel.title}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-bg text-navy py-3 rounded-xl text-xs font-black text-center no-underline border border-border hover:bg-white transition-all">
                            Directions
                         </a>
                      </div>
                   </div>
                ) : (
                   <div className="text-center py-3 space-y-6">
                      <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mx-auto">
                         <AlertTriangle size={32} />
                      </div>
                      <div>
                         <p className="font-bold text-navy">No Hotel Found</p>
                         <p className="text-[11px] text-text-muted mt-1 leading-relaxed">You haven't added a hotel for this trip yet.</p>
                      </div>
                      <button onClick={() => handleTabChange('hotels')} className="w-full bg-accent text-white py-3 rounded-xl text-xs font-black border-0 cursor-pointer shadow-lg shadow-accent/20">Find Budget Stays</button>
                   </div>
                )}
             </div>
          </div>

          <div className="bg-navy rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl shadow-navy/40">
             <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-xl -mr-20 -mt-20" />
             <div className="relative z-10">
                <Compass size={48} className="mb-6 text-accent" />
                <h4 className="text-2xl font-black mb-3">Around Your Stay</h4>
                <p className="text-sm text-white/70 mb-8 font-medium leading-relaxed">Find the best dining and spots near your booked hotel for convenience.</p>
                <div className="grid gap-3">
                   <button onClick={() => handleTabChange('dining')} className="w-full bg-white text-navy py-3 rounded-xl text-xs font-black border-0 cursor-pointer hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                      <Utensils size={14} /> NEARBY FOOD
                   </button>
                   <button onClick={() => handleTabChange('sightseeing')} className="w-full bg-white/10 text-white py-3 rounded-xl text-xs font-black border border-white/20 cursor-pointer hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                      <Compass size={14} /> EXPLORE AREA
                   </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
