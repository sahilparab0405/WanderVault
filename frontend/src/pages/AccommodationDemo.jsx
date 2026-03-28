/**
 * AccommodationDemo — Test page for upgraded AccommodationCards component
 * Tests: Filter bar, OYO inspired layout, mock data generation
 * DELETE before production deployment.
 */

import AccommodationList from '../components/AccommodationList';

const MOCK_PLACES = [
  { id: '1', name: 'Paradise Beach Resort', distance: '1.2km', distanceKm: 1.2, address: 'Calangute, Goa' },
  { id: '2', name: 'Taj Exotica', distance: '3.4km', distanceKm: 3.4, address: 'Benaulim, Goa' },
  { id: '3', name: 'W Goa', distance: '0.8km', distanceKm: 0.8, address: 'Vagator, Goa' },
  { id: '4', name: 'Leela Palace', distance: '2.1km', distanceKm: 2.1, address: 'Cavelossim, Goa' },
  { id: '5', name: 'Novotel Goa Resort', distance: '1.5km', distanceKm: 1.5, address: 'Candolim, Goa' },
];

export default function AccommodationDemo() {
  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Accommodation Cards Preview
          </h1>
          <p className="text-text-secondary text-sm mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            Testing OYO-inspired layout, Image integrations, deterministic pricing and filters.
          </p>
        </div>

        <AccommodationList places={MOCK_PLACES} tripId="mockTripId123" />
      </div>
    </div>
  );
}
