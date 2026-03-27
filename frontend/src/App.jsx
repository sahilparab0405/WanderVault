import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import TripDetail from './pages/TripDetail';
import Itinerary from './pages/Itinerary';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;