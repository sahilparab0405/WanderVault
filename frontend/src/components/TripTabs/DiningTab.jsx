import React, { Suspense, lazy } from 'react';
import { Utensils } from 'lucide-react';

const DiningNearby = lazy(() => import('../../components/DiningNearby'));

export default function DiningTab({ bookedHotel, trip }) {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
       <div className="bg-white rounded-3xl p-8 lg:p-14 border border-border shadow-xl">
          <div className="mb-12">
             <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-6 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest mb-3">
                <Utensils size={12} /> Local Gastronomy
             </div>
             <h2 className="text-4xl font-black text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Nearby Dining</h2>
             <p className="text-text-secondary text-lg">Taste the local flavors! Verified eateries near {bookedHotel ? 'your booked hotel' : trip.destination}.</p>
          </div>
          <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-12 w-64 bg-border rounded-xl" /><div className="h-80 bg-border rounded-3xl" /></div>}>
             <DiningNearby 
                latitude={bookedHotel?.lat || trip.latitude} 
                longitude={bookedHotel?.lon || trip.longitude} 
             />
          </Suspense>
       </div>
    </div>
  );
}
