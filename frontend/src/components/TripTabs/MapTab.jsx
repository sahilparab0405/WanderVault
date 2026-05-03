import React, { Suspense, lazy } from 'react';

const TripMap = lazy(() => import('../../components/TripMap'));

export default function MapTab({ trip, allNearbyPins }) {
  return (
    <div className="max-w-6xl mx-auto h-[75vh]">
       <Suspense fallback={<div className="h-full w-full bg-white rounded-3xl border border-border animate-pulse flex items-center justify-center text-text-muted text-sm font-bold">CALIBRATING GPS SATELLITES...</div>}>
          <TripMap latitude={Number(trip.latitude)} longitude={Number(trip.longitude)} destination={trip.destination} nearbyPlaces={allNearbyPins} />
       </Suspense>
    </div>
  );
}
