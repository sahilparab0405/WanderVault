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

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import {
  LayoutDashboard, Plane, Wallet, CalendarDays, Compass,
  Settings, LogOut, Menu, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard',       label: 'Dashboard',  Icon: LayoutDashboard },
  { to: '/create-trip',     label: 'Trips',       Icon: Plane          },
  { to: '/budget-demo',     label: 'Budget',      Icon: Wallet         },
  { to: '/trip-itinerary',  label: 'Itinerary',   Icon: CalendarDays   },
  { to: '/accommodation-demo', label: 'Explore', Icon: Compass         },
];

/* ─── Sidebar inner (shared by desktop + mobile) ─── */
function SidebarInner({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '100vh' }}>

      {/* ── Logo ── */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between border-b border-white/10">
        <Link to="/dashboard" className="no-underline" onClick={onClose}>
          <Logo size="default" className="brightness-0 invert" showText={true} />
        </Link>
        {/* Mobile close button */}
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
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-white/30 px-3 mb-3"
           style={{ fontFamily: "'Inter', sans-serif" }}>
          Navigation
        </p>
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline
                text-sm font-medium transition-all duration-150 group
                ${active
                  ? 'bg-white/10 text-white border-l-[3px] border-accent pl-[9px]'
                  : 'text-white/60 hover:bg-white/8 hover:text-white border-l-[3px] border-transparent pl-[9px]'
                }
              `}
              id={`sidebar-nav-${label.toLowerCase()}`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <Icon
                size={18}
                strokeWidth={1.5}
                style={{ color: active ? '#FF6B35' : 'currentColor', flexShrink: 0 }}
              />
              <span>{label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Settings link ── */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 text-sm cursor-not-allowed"
             style={{ fontFamily: "'Inter', sans-serif" }}>
          <Settings size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          <span>Settings</span>
          <span className="ml-auto text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full font-semibold">soon</span>
        </div>
      </div>

      {/* ── User footer ── */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold uppercase shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FF6B35, #E5552A)',
              fontFamily: "'Poppins', sans-serif",
              color: '#fff',
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight"
               style={{ fontFamily: "'Inter', sans-serif" }}>
              {user?.name || 'User'}
            </p>
            <p className="text-[11px] text-white/40 truncate"
               style={{ fontFamily: "'Inter', sans-serif" }}>
              {user?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          id="sidebar-logout"
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl
                     text-xs font-semibold text-white/60 hover:text-white
                     border border-white/10 hover:border-white/20 hover:bg-white/8
                     transition-all duration-150 cursor-pointer bg-transparent"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <LogOut size={14} strokeWidth={1.5} />
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
        <Logo size="small" showText={true} className="brightness-0 invert" />
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
