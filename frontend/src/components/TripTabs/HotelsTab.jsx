import React from 'react';
import { Building, Search, MapPin, Star } from 'lucide-react';

export default function HotelsTab({ trip, hotelSearch, setHotelSearch, searchHotels, isSearchingHotels, hotelResults, setHotelPromptTarget }) {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
       <div className="bg-white rounded-3xl p-8 lg:p-14 border border-border shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
             <div>
                <div className="inline-flex items-center gap-2 bg-success/10 text-success px-6 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest mb-3">
                   <Building size={12} /> Budget Accommodations
                </div>
                <h2 className="text-4xl font-black text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Find Your Stay</h2>
                <p className="text-text-secondary text-lg">Search and book verified budget hotels in {trip.destination}.</p>
             </div>
             <div className="flex gap-3 bg-bg p-2 rounded-xl border border-border w-full md:w-auto">
                <input 
                   type="text" 
                   placeholder="Search hotel name..."
                   value={hotelSearch}
                   onChange={e => setHotelSearch(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && searchHotels()}
                   className="px-6 py-3 rounded-xl border border-border bg-white text-sm focus:ring-4 focus:ring-primary/10 transition-all w-full md:w-72"
                />
                <button 
                   onClick={searchHotels}
                   disabled={isSearchingHotels}
                   className="bg-navy text-white px-6 py-3 rounded-xl hover:bg-navy-dark transition-all border-0 cursor-pointer shrink-0 shadow-lg shadow-navy/20"
                >
                   {isSearchingHotels ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-xl animate-spin block"></span> : <Search size={20} />}
                </button>
             </div>
          </div>

          {hotelResults.length > 0 ? (
             <div className="grid md:grid-cols-2 gap-8">
                {hotelResults.map(hotel => {
                   const gradient = hotel.price > 5000
                     ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                     : hotel.price > 2000
                     ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                     : 'linear-gradient(135deg, #22c55e, #14b8a6)';
                   return (
                   <div key={hotel.id} className="group bg-bg rounded-3xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all relative">
                      {/* Gradient banner */}
                      <div className="h-20 relative" style={{ background: gradient }}>
                         <div className="absolute inset-0 flex items-center justify-between px-8">
                            <div className="flex items-center gap-3">
                               <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                  <Building size={24} className="text-white" />
                               </div>
                               <div>
                                 <p className="text-white font-black text-sm line-clamp-1">{hotel.name}</p>
                                 <p className="text-white/70 text-[10px] font-bold">Verified Stay</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-xl">
                               <Star size={11} fill="#fff" strokeWidth={0} />
                               <span className="text-white text-xs font-bold">{hotel.rating}</span>
                            </div>
                         </div>
                      </div>
                      <div className="p-8 relative">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                         <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                               <p className="text-xs text-text-muted flex items-center gap-1">
                                  <MapPin size={12} className="text-accent" /> {hotel.address.split(',').slice(0, 3).join(',')}
                               </p>
                               <div className="text-right">
                                  <p className="text-2xl font-black text-navy">₹{hotel.price.toLocaleString()}</p>
                                  <p className="text-[10px] font-bold text-text-muted uppercase">per night</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                               <div className="text-[11px] font-bold text-success uppercase tracking-widest">Available Now</div>
                            </div>
                            <button onClick={() => setHotelPromptTarget(hotel)} className="w-full bg-navy text-white py-3 rounded-3xl text-sm font-black transition-all border-0 cursor-pointer shadow-lg shadow-navy/20 active:scale-95">
                               BOOK THIS STAY
                            </button>
                         </div>
                      </div>
                   </div>
                );
                })}
             </div>
          ) : (
             <div className="text-center py-20 bg-bg rounded-3xl border-2 border-dashed border-border">
                <Search size={64} className="text-text-muted/30 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-navy mb-2">Start Your Search</h3>
                <p className="text-text-secondary max-w-xs mx-auto">Enter a hotel name or keyword to find the best budget stays in {trip.destination}.</p>
             </div>
          )}
       </div>
    </div>
  );
}
