import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

/**
 * WanderVault Professional Navbar
 * 
 * Layout:
 *   LEFT   → WanderVault logo (Logo.jsx)
 *   CENTER → My Trips | Plan Trip | Budget (desktop)
 *   RIGHT  → Username + Logout button
 * 
 * Features:
 *   - Sticky top positioning with white bg + subtle shadow
 *   - Mobile hamburger menu with slide-down animation
 *   - Active link highlighting
 *   - Consistent across all authenticated pages
 */

const NAV_LINKS = [
  { to: '/dashboard', label: 'My Trips', id: 'nav-my-trips' },
  { to: '/create-trip', label: 'Plan Trip', id: 'nav-plan-trip' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  // Don't render on auth pages
  if (!user) return null;

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      id="navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border"
      style={{ boxShadow: 'var(--shadow-navbar)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* LEFT — Logo */}
          <Link
            to="/dashboard"
            className="shrink-0 no-underline"
            id="navbar-logo"
            aria-label="WanderVault Home"
          >
            <Logo size="default" />
          </Link>

          {/* CENTER — Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                id={link.id}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors duration-150
                  ${isActive(link.to)
                    ? 'bg-primary-50 text-primary font-semibold'
                    : 'text-text-secondary hover:text-navy hover:bg-border-light'
                  }
                `}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* RIGHT — User Info + Logout (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg"
              id="navbar-user-info"
            >
              {/* User avatar circle */}
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold uppercase"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span
                className="text-sm font-medium text-navy max-w-[120px] truncate"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {user?.name || 'User'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              id="navbar-logout"
              className="text-sm font-medium px-3 py-1.5 rounded-lg border border-border text-text-secondary 
                         hover:text-danger hover:border-danger hover:bg-danger-light transition-colors duration-150 cursor-pointer bg-white"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Logout
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-border-light transition-colors cursor-pointer bg-transparent border-0"
            id="navbar-mobile-toggle"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span
              className="block w-5 h-0.5 bg-navy rounded-full transition-all duration-200"
              style={{
                transform: mobileOpen ? 'rotate(45deg) translate(2px, 2px)' : 'none',
              }}
            />
            <span
              className="block w-5 h-0.5 bg-navy rounded-full transition-all duration-200 mt-1"
              style={{
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              className="block w-5 h-0.5 bg-navy rounded-full transition-all duration-200 mt-1"
              style={{
                transform: mobileOpen ? 'rotate(-45deg) translate(3px, -3px)' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out border-t border-border bg-white ${
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 border-t-0'
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`
                block px-4 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors duration-150
                ${isActive(link.to)
                  ? 'bg-primary-50 text-primary font-semibold'
                  : 'text-text-secondary hover:text-navy hover:bg-border-light'
                }
              `}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile user section */}
          <div className="pt-2 mt-2 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold uppercase"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-navy"
                   style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-text-muted">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              id="navbar-mobile-logout"
              className="w-full mt-2 text-sm font-medium px-4 py-2.5 rounded-lg border border-border text-text-secondary 
                         hover:text-danger hover:border-danger hover:bg-danger-light transition-colors duration-150 cursor-pointer bg-white"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
