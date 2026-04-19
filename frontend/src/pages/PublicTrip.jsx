import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Calendar, Plane, Clock, Building, Compass,
  Lock, Globe, ArrowRight, Sparkles
} from 'lucide-react';

const TripMap = lazy(() => import('../components/TripMap'));

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PublicTrip() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicTrip = async () => {
      try {
        const res = await fetch(`${API_URL}/trips/public/${id}`);
        if (res.status === 403) {
          setError('This trip is private and cannot be viewed.');
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error('Trip not found');
        const data = await res.json();
        setTrip(data);
      } catch (err) {
        setError(err.message || 'Failed to load trip.');
      }
      setLoading(false);
    };
    fetchPublicTrip();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-navy/20 border-t-navy rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center border border-border shadow-xl">
          <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-navy mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {error?.includes('private') ? 'Private Trip' : 'Trip Not Found'}
          </h2>
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">
            {error || 'This trip does not exist or has been removed.'}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-8 py-3.5 rounded-xl font-bold text-sm no-underline transition-all shadow-lg shadow-accent/20"
          >
            <Sparkles size={16} /> Create my trip
          </Link>
        </div>
      </div>
    );
  }

  const totalDays = Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24));

  // Group itinerary by day
  const itineraryByDay = {};
  (trip.itinerary || []).forEach(item => {
    const day = item.day || 1;
    if (!itineraryByDay[day]) itineraryByDay[day] = [];
    itineraryByDay[day].push(item);
  });

  return (
    <div className="min-h-screen bg-bg">
      {/* ── Public Banner ── */}
      <div className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-accent" />
            <p className="text-xs font-medium">
              Viewing <span className="font-bold">{trip.userName}'s</span> trip to <span className="font-bold">{trip.destination}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/50 font-medium hidden sm:inline">Plan your own trip on WanderVault</span>
            <Link
              to="/register"
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-dark text-white px-4 py-1.5 rounded-lg text-xs font-bold no-underline transition-all"
            >
              <Sparkles size={12} /> Create my trip
            </Link>
          </div>
        </div>
      </div>

      {/* ── Hero Header ── */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Plane size={12} /> Shared Travel Plan
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-navy leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {trip.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-text-secondary">
              <div className="flex items-center gap-1.5 bg-bg px-3 py-1.5 rounded-xl border border-border">
                <MapPin size={16} className="text-accent" />
                <span className="text-sm font-bold text-navy">{trip.destination}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-bg px-3 py-1.5 rounded-xl border border-border">
                <Calendar size={16} className="text-primary" />
                <span className="text-sm font-bold text-navy">
                  {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-bg px-3 py-1.5 rounded-xl border border-border">
                <Clock size={16} className="text-success" />
                <span className="text-sm font-bold text-navy">{totalDays} Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Map */}
        {trip.latitude && trip.longitude && (
          <div className="bg-white rounded-[2rem] overflow-hidden border border-border shadow-sm h-[350px]">
            <Suspense fallback={<div className="h-full w-full bg-border/20 animate-pulse flex items-center justify-center text-text-muted text-sm">Loading Map...</div>}>
              <TripMap latitude={Number(trip.latitude)} longitude={Number(trip.longitude)} destination={trip.destination} />
            </Suspense>
          </div>
        )}

        {/* Day-wise Itinerary */}
        {Object.keys(itineraryByDay).length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-navy flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <Calendar size={24} className="text-primary" /> Trip Itinerary
            </h2>
            {Object.entries(itineraryByDay).sort(([a], [b]) => a - b).map(([day, items]) => (
              <div key={day} className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-navy text-white rounded-xl flex items-center justify-center font-black text-sm">
                    {day}
                  </div>
                  <h3 className="font-bold text-navy text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>Day {day}</h3>
                </div>
                <div className="space-y-3 ml-5 border-l-2 border-border-light pl-6">
                  {items.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1.5 w-3 h-3 bg-accent rounded-full border-2 border-white shadow-sm" />
                      <h4 className="font-bold text-navy text-sm">{item.title}</h4>
                      {item.location && (
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-accent" /> {item.location}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
            <Compass size={40} className="text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-navy mb-1">No itinerary yet</h3>
            <p className="text-sm text-text-secondary">The traveler hasn't added any activities to their plan yet.</p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="bg-navy rounded-[2rem] p-10 text-white text-center relative overflow-hidden shadow-2xl shadow-navy/40">
          <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="relative z-10 space-y-4">
            <Sparkles size={40} className="text-accent mx-auto" />
            <h3 className="text-2xl font-black">Plan your own adventure</h3>
            <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed">
              Create your own trip plan with WanderVault. Track budgets, discover nearby food spots, and share your itinerary with friends.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-bold text-sm no-underline transition-all shadow-lg shadow-accent/40"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
