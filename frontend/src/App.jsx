import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
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

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner message="Loading..." />;
  return user ? children : <Navigate to="/login" replace />;
};

/*
 * AppShell — wraps authenticated routes in the sidebar layout.
 * Auth pages (login / register) render full-screen with no shell.
 */
function AppShell({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

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
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <ErrorBoundary><Dashboard /></ErrorBoundary>
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
            <Route path="/budget-demo" element={<BudgetDemo />} />
            <Route path="/accommodation-demo" element={<AccommodationDemo />} />
            <Route path="/dashboard-demo" element={<DashboardDemo />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppShell>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;