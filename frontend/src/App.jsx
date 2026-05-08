import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import { PageSpinner } from './components/Skeleton';
import Login from './pages/Login';
import Register from './pages/Register';
import API from './api/axios';
import { useState, useEffect, lazy, Suspense } from 'react';

// Lazy-load all heavy page components for faster initial load
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateTrip = lazy(() => import('./pages/CreateTrip'));
const TripDetail = lazy(() => import('./pages/TripDetail'));
const Itinerary = lazy(() => import('./pages/Itinerary'));
const Budget = lazy(() => import('./pages/Budget'));
const Explore = lazy(() => import('./pages/Explore'));
const Settings = lazy(() => import('./pages/Settings'));
const PublicTrip = lazy(() => import('./pages/PublicTrip'));

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner message="Loading..." />;
  return user ? children : <Navigate to="/login" replace />;
};

/**
 * GlobalItinerary — Handles the /itinerary route by finding 
 * the most recent/active trip and redirecting to its itinerary.
 */
function GlobalItinerary() {
  const [loading, setLoading] = useState(true);
  const [tripId, setTripId] = useState(null);

  useEffect(() => {
    const findTrip = async () => {
      try {
        const { data } = await API.get('/trips');
        if (data && data.length > 0) {
          // Find active or most recent
          const now = new Date();
          const active = data.find(t => new Date(t.startDate) <= now && new Date(t.endDate) >= now);
          setTripId(active ? active._id : data[0]._id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    findTrip();
  }, []);

  if (loading) return <PageSpinner message="Finding your itinerary..." />;
  if (!tripId) return <Navigate to="/dashboard" replace />;
  return <Navigate to={`/trip/${tripId}/itinerary`} replace />;
}

/*
 * AppShell — wraps authenticated routes in the sidebar layout.
 * Auth pages (login / register) render full-screen with no shell.
 */
function AppShell({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/trip/public');

  if (!user || isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="sidebar-shell">
      <Sidebar />
      <main className="wv-main lg:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppShell>
          <Suspense fallback={<PageSpinner message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/trip/public/:id" element={<PublicTrip />} />
            
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <ErrorBoundary><Dashboard /></ErrorBoundary>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/explore"
              element={
                <PrivateRoute>
                  <ErrorBoundary><Explore /></ErrorBoundary>
                </PrivateRoute>
              }
            />

            <Route
              path="/budget"
              element={
                <PrivateRoute>
                  <ErrorBoundary><Budget /></ErrorBoundary>
                </PrivateRoute>
              }
            />

            <Route
              path="/itinerary"
              element={
                <PrivateRoute>
                  <ErrorBoundary><GlobalItinerary /></ErrorBoundary>
                </PrivateRoute>
              }
            />

            <Route
              path="/create-trip"
              element={
                <PrivateRoute>
                  <ErrorBoundary><CreateTrip /></ErrorBoundary>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/trips"
              element={<Navigate to="/dashboard" replace />}
            />

            <Route
              path="/trip/:id"
              element={
                <PrivateRoute>
                  <ErrorBoundary><TripDetail /></ErrorBoundary>
                </PrivateRoute>
              }
            />
            <Route
              path="/trip/:id/itinerary"
              element={
                <PrivateRoute>
                  <ErrorBoundary><Itinerary /></ErrorBoundary>
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <ErrorBoundary><Settings /></ErrorBoundary>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        </AppShell>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;