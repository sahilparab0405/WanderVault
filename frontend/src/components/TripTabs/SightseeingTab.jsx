import React, { Suspense, lazy } from 'react';
import { Compass } from 'lucide-react';

const SightseeingNearby = lazy(() => import('../../components/SightseeingNearby'));

export default function SightseeingTab({ bookedHotel, trip }) {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
       <div className="bg-white rounded-3xl p-8 lg:p-14 border border-border shadow-xl">
          <div className="mb-12">
             <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-1 rounded- text-[10px] font-bold uppercase tracking-widest mb-3">
                <Compass size={12} /> Local Wonders
             </div>
             <h2 className="text-4xl font-black text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Discover the Area</h2>
             <p className="text-text-secondary text-lg">Must-visit spots and cultural landmarks near {bookedHotel ? 'your stay' : 'your destination'}.</p>
          </div>
          <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-12 w-64 bg-border rounded-" /><div className="h-80 bg-border rounded-3xl" /></div>}>
             <SightseeingNearby 
                latitude={bookedHotel?.lat || trip.latitude} 
                longitude={bookedHotel?.lon || trip.longitude} 
             />
          </Suspense>
       </div>
    </div>
  );
}
