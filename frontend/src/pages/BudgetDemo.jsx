/**
 * BudgetDemo — Test page for upgraded BudgetTracker component
 * Tests: Recharts pie chart, bar chart, lottery voucher card, PDF export
 * DELETE before production deployment.
 */

import BudgetTracker from '../components/BudgetTracker';

const MOCK_TRIP = {
  _id: '67e5a1b2c3d4e5f600123456',
  name: 'Goa Beach Getaway',
  destination: 'Goa, India',
  travelMode: 'flight',
  startDate: '2026-03-20',
  endDate: '2026-03-28',
  budget: 25000,
  totalExpense: 18200,
  budgetExceeded: false,
};

const MOCK_EXPENSES = [
  { _id: 'e1', title: 'Flight tickets', amount: 6500, category: 'Transport', date: '2026-03-20' },
  { _id: 'e2', title: 'Hotel booking', amount: 4200, category: 'Hotel', date: '2026-03-20' },
  { _id: 'e3', title: 'Lunch at beach shack', amount: 450, category: 'Food', date: '2026-03-21' },
  { _id: 'e4', title: 'Water sports', amount: 2000, category: 'Activities', date: '2026-03-22' },
  { _id: 'e5', title: 'Dinner at resort', amount: 1200, category: 'Food', date: '2026-03-22' },
  { _id: 'e6', title: 'Souvenir shopping', amount: 800, category: 'Shopping', date: '2026-03-23' },
  { _id: 'e7', title: 'Breakfast buffet', amount: 350, category: 'Food', date: '2026-03-23' },
  { _id: 'e8', title: 'Sunset cruise', amount: 1500, category: 'Activities', date: '2026-03-24' },
  { _id: 'e9', title: 'Local taxi rides', amount: 700, category: 'Transport', date: '2026-03-25' },
  { _id: 'e10', title: 'Street food', amount: 500, category: 'Food', date: '2026-03-26' },
];

/* Over-budget variant for testing color-coded states */
const MOCK_TRIP_OVER = {
  _id: '67e5a1b2c3d4e5f600789012',
  name: 'Manali Winter Trip',
  destination: 'Manali, India',
  travelMode: 'bus',
  startDate: '2026-03-15',
  endDate: '2026-03-20',
  budget: 12000,
  totalExpense: 15800,
  budgetExceeded: true,
};

const MOCK_EXPENSES_OVER = [
  { _id: 'o1', title: 'Bus tickets', amount: 3200, category: 'Transport', date: '2026-03-15' },
  { _id: 'o2', title: 'Resort stay', amount: 5500, category: 'Hotel', date: '2026-03-15' },
  { _id: 'o3', title: 'Paragliding', amount: 3000, category: 'Activities', date: '2026-03-16' },
  { _id: 'o4', title: 'Restaurant meals', amount: 2100, category: 'Food', date: '2026-03-17' },
  { _id: 'o5', title: 'Winter gear', amount: 2000, category: 'Shopping', date: '2026-03-18' },
];

export default function BudgetDemo() {
  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Budget Analytics Preview
          </h1>
          <p className="text-text-secondary text-sm mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            Testing Recharts integration, lottery voucher card, and PDF export
          </p>
        </div>

        {/* On-budget scenario */}
        <div>
          <h2 className="text-sm font-bold text-success mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
            ✅ On Budget — Goa Beach Getaway
          </h2>
          <BudgetTracker trip={MOCK_TRIP} expenses={MOCK_EXPENSES} />
        </div>

        {/* Over-budget scenario */}
        <div>
          <h2 className="text-sm font-bold text-danger mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
            ⚠️ Over Budget — Manali Winter Trip
          </h2>
          <BudgetTracker trip={MOCK_TRIP_OVER} expenses={MOCK_EXPENSES_OVER} />
        </div>
      </div>
    </div>
  );
}
