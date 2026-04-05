import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { PageSpinner } from './components/Skeleton';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import TripDetail from './pages/TripDetail';
import Itinerary from './pages/Itinerary';
import BudgetDemo from './pages/BudgetDemo';
import AccommodationDemo from './pages/AccommodationDemo';
import DashboardDemo from './pages/DashboardDemo';

/**
 * PrivateRoute — redirects unauthenticated users to /login
 * FIX 6: Shows PageSpinner (not blank) while auth state loads
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner message="Loading..." />;
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      {/* Global error boundary — catches any render crash */}
      <ErrorBoundary>
        {/* Navbar renders on all pages — self-hides on auth pages */}
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/create-trip"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <CreateTrip />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/trip/:id"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <TripDetail />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/trip/:id/itinerary"
            element={
              <PrivateRoute>
                <ErrorBoundary>
                  <Itinerary />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route path="/budget-demo" element={<BudgetDemo />} />
          <Route path="/accommodation-demo" element={<AccommodationDemo />} />
          <Route path="/dashboard-demo" element={<DashboardDemo />} />
          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;