import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
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
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
          Loading...
        </p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      {/* Navbar renders on all pages — it self-hides on auth pages via useAuth check */}
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/create-trip" element={
          <PrivateRoute><CreateTrip /></PrivateRoute>
        } />
        <Route path="/trip/:id" element={
          <PrivateRoute><TripDetail /></PrivateRoute>
        } />
        <Route path="/trip/:id/itinerary" element={
          <PrivateRoute><Itinerary /></PrivateRoute>
        } />
        <Route path="/budget-demo" element={<BudgetDemo />} />
        <Route path="/accommodation-demo" element={<AccommodationDemo />} />
        <Route path="/dashboard-demo" element={<DashboardDemo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;