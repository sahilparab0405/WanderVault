/**
 * Register.jsx — User registration page
 *
 * FIX 5: Full client-side validation (name, email, password)
 * FIX 6: Button loading state, no blank screens
 * FIX 7: Standard Web APIs only — works on Chrome + Edge
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

/* ── Validation helpers ───────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  if (!form.name.trim() || form.name.trim().length < 2) {
    return 'Full name must be at least 2 characters.';
  }
  if (!EMAIL_RE.test(form.email.trim())) {
    return 'Please enter a valid email address.';
  }
  if (form.password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null; // valid
}

/* ── Inline field error ───────────────────────────────────── */
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-danger mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
      {msg}
    </p>
  );
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  /* ── Per-field live validation ── */
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim().length > 0 && value.trim().length < 2
          ? 'At least 2 characters required'
          : '';
      case 'email':
        return value && !EMAIL_RE.test(value.trim())
          ? 'Enter a valid email'
          : '';
      case 'password':
        return value && value.length < 6
          ? 'At least 6 characters required'
          : '';
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
    const validationError = validate(form);
    if (validationError) {
      setServerError(validationError);
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      const { data } = await API.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    form.name.trim().length >= 2 &&
    EMAIL_RE.test(form.email) &&
    form.password.length >= 6;

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
          Start your journey today!
        </p>

        {/* Server-side error banner */}
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
          {/* Full Name */}
          <div>
            <label
              htmlFor="register-name"
              className="block text-sm font-medium text-navy mb-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Full Name
            </label>
            <input
              type="text"
              id="register-name"
              name="name"
              required
              autoComplete="name"
              placeholder="Sahil Parab"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white text-navy transition-colors duration-150 ${
                fieldErrors.name ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
              value={form.name}
              onChange={handleChange}
              disabled={loading}
            />
            <FieldError msg={fieldErrors.name} />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-navy mb-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Email Address
            </label>
            <input
              type="email"
              id="register-email"
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
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-navy mb-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Password
            </label>
            <input
              type="password"
              id="register-password"
              name="password"
              required
              autoComplete="new-password"
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
            {form.password.length > 0 && (
              <p className="text-xs text-text-muted mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                Strength:{' '}
                <span
                  className={
                    form.password.length < 6
                      ? 'text-danger font-semibold'
                      : form.password.length < 10
                      ? 'text-warning font-semibold'
                      : 'text-success font-semibold'
                  }
                >
                  {form.password.length < 6 ? 'Weak' : form.password.length < 10 ? 'Medium' : 'Strong'}
                </span>
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            id="register-submit"
            disabled={loading || !isFormValid}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all duration-150 cursor-pointer border-0 text-sm flex items-center justify-center gap-2"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p
          className="text-center text-sm text-text-secondary mt-5"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline no-underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}