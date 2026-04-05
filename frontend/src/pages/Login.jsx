/**
 * Login.jsx — User login page
 *
 * FIX 5: Full client-side validation (email, password)
 * FIX 6: Button loading state, disabled when invalid
 * FIX 7: Standard Web APIs only — works on Chrome + Edge
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-danger mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
      {msg}
    </p>
  );
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return value && !EMAIL_RE.test(value.trim()) ? 'Enter a valid email' : '';
      case 'password':
        return value && value.length < 1 ? 'Password is required' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(form.email.trim())) {
      setServerError('Please enter a valid email address.');
      return;
    }
    if (!form.password) {
      setServerError('Password is required.');
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      const { data } = await API.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Login failed. Check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = EMAIL_RE.test(form.email) && form.password.length > 0;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div
        className="bg-card rounded-xl p-8 w-full max-w-md border border-border"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <Logo size="large" />
        </div>
        <p
          className="text-center text-text-secondary mb-6 text-sm"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Welcome back, traveler! ✈️
        </p>

        {/* Server error banner */}
        {serverError && (
          <div
            className="bg-danger-light text-danger p-3 rounded-lg mb-4 text-sm font-medium border border-danger/20 flex items-start gap-2"
            role="alert"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-navy mb-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Email Address
            </label>
            <input
              type="email"
              id="login-email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white text-navy transition-colors duration-150 ${
                fieldErrors.email ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />
            <FieldError msg={fieldErrors.email} />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-navy"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Password
              </label>
            </div>
            <input
              type="password"
              id="login-password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white text-navy transition-colors duration-150 ${
                fieldErrors.password ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
              value={form.password}
              onChange={handleChange}
              disabled={loading}
            />
            <FieldError msg={fieldErrors.password} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="login-submit"
            disabled={loading || !isFormValid}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all duration-150 cursor-pointer border-0 text-sm flex items-center justify-center gap-2"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p
          className="text-center text-sm text-text-secondary mt-5"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline no-underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}