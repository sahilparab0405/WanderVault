/**
 * WanderVault Sidebar Navigation
 *
 * Layout: Fixed left panel, 240px, navy #1a2b4a background
 * - Logo at top
 * - Nav items with lucide icons
 * - Active item: orange #FF6B35 text + left border
 * - User info at bottom with logout
 * - Mobile: slide-in overlay via .open class on .wv-sidebar
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Logo from './Logo';
import {
  LayoutDashboard, Plane, Wallet, CalendarDays, Compass,
  Settings, LogOut, Menu, X, MapPin, Loader2
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard',       label: 'Dashboard',  Icon: LayoutDashboard },
  { to: '/trips',           label: 'Trips',       Icon: Plane          },
  { to: '/budget',          label: 'Budget',      Icon: Wallet         },
  { to: '/itinerary',       label: 'Itinerary',   Icon: CalendarDays   },
  { to: '/explore',         label: 'Explore',     Icon: Compass         },
];

/* ─── Sidebar inner (shared by desktop + mobile) ─── */
function SidebarInner({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTrip, setActiveTrip] = useState(null);
  const [loadingTrip, setLoadingTrip] = useState(false);

  useEffect(() => {
    const fetchActiveTrip = async () => {
      setLoadingTrip(true);
      try {
        const { data } = await API.get('/trips');
        const now = new Date();
        const active = data.find(t => {
          const start = new Date(t.startDate);
          const end = new Date(t.endDate);
          return start <= now && end >= now;
        });
        setActiveTrip(active);
      } catch (err) {
        console.error('Sidebar: Failed to fetch active trip', err);
      } finally {
        setLoadingTrip(false);
      }
    };
    if (user) fetchActiveTrip();
  }, [user]);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const getDaysRemaining = (endDate) => {
    const remaining = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return remaining > 0 ? remaining : 0;
  };

  return (
    <div className="flex flex-col h-full bg-navy border-r border-white/5" style={{ minHeight: '100vh', width: '240px' }}>

      {/* ── Logo ── */}
      <div className="px-6 pt-8 pb-6 flex items-center justify-between border-b border-white/5">
        <Link to="/dashboard" className="no-underline" onClick={onClose}>
          <Logo size="md" dark={true} />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-0 bg-transparent"
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 px-4 py-8 space-y-1">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30 px-3 mb-4"
           style={{ fontFamily: "'Inter', sans-serif" }}>
          Menu
        </p>
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl no-underline
                text-sm font-semibold transition-all duration-200 group
                ${active
                  ? 'bg-white/10 text-white shadow-lg shadow-black/10'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
                }
              `}
              id={`sidebar-nav-${label.toLowerCase()}`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2 : 1.5}
                style={{ color: active ? '#FF6B35' : 'currentColor', flexShrink: 0 }}
              />
              <span>{label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Active Trip Indicator ── */}
      {activeTrip && (
        <div className="px-4 mb-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
               <Loader2 size={12} className="text-accent animate-pulse" />
            </div>
            <p className="text-[9px] font-bold text-accent uppercase tracking-wider mb-2">Currently Traveling</p>
            <h4 className="text-white text-xs font-bold truncate mb-1">{activeTrip.name}</h4>
            <div className="flex items-center gap-1 text-white/40 text-[10px] mb-3">
              <MapPin size={10} />
              <span className="truncate">{activeTrip.destination}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-[10px] font-medium">{getDaysRemaining(activeTrip.endDate)} days left</span>
              <Link to={`/trip/${activeTrip._id}`} className="text-accent text-[10px] font-bold no-underline hover:underline">Details →</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings ── */}
      <div className="px-4 pb-2">
        <Link
          to="/settings"
          onClick={onClose}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl no-underline
            text-sm font-semibold transition-all duration-200
            ${location.pathname === '/settings'
              ? 'bg-white/10 text-white shadow-lg shadow-black/10'
              : 'text-white/50 hover:bg-white/5 hover:text-white'
            }
          `}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <Settings
            size={18}
            strokeWidth={location.pathname === '/settings' ? 2 : 1.5}
            style={{ color: location.pathname === '/settings' ? '#FF6B35' : 'currentColor', flexShrink: 0 }}
          />
          <span>Settings</span>
        </Link>
      </div>

      {/* ── User footer ── */}
      <div className="px-4 py-6 border-t border-white/5 m-2 bg-black/20 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold uppercase shadow-inner"
            style={{
              background: 'linear-gradient(135deg, #FF6B35, #E5552A)',
              color: '#fff',
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate leading-tight">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] text-white/30 truncate mt-0.5 font-medium">
              {user?.email || 'traveler@wandervault.com'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          id="sidebar-logout"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                     text-xs font-bold text-white/60 hover:text-white
                     border border-white/10 hover:bg-white/5
                     transition-all duration-200 cursor-pointer bg-transparent"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

/* ─── Main export: Sidebar shell wrapper ─── */
export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`wv-sidebar hidden lg:block`}>
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-navy flex items-center px-4 gap-3"
           style={{ background: '#1a2b4a' }}>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer border-0 bg-transparent"
          aria-label="Open menu"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
        <Logo size="sm" dark={true} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          {/* Drawer */}
          <aside
            className="relative w-[240px] h-full flex-shrink-0"
            style={{ background: '#1a2b4a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarInner onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
