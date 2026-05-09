/**
 * Register — Full-screen travel background + centered white form card
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { AlertTriangle, Mail, Lock, User, ArrowRight } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BG_URL = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80&fit=crop';

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-danger mt-1 flex items-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}>
      <AlertTriangle size={10} strokeWidth={1.5} />{msg}
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

  const validateField = (name, value) => {
    switch (name) {
      case 'name': return value && value.trim().length < 2 ? 'Name must be at least 2 characters' : '';
      case 'email': return value && !EMAIL_RE.test(value.trim()) ? 'Enter a valid email' : '';
      case 'password': return value && value.length < 6 ? 'Password must be at least 6 characters' : '';
      default: return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {
      name: form.name.trim().length < 2 ? 'Name must be at least 2 characters' : '',
      email: !EMAIL_RE.test(form.email.trim()) ? 'Enter a valid email' : '',
      password: form.password.length < 6 ? 'Password must be at least 6 characters' : '',
    };
    if (Object.values(errs).some(Boolean)) { setFieldErrors(errs); return; }
    setLoading(true); setServerError('');
    try {
      const { data } = await API.post('/auth/register', { name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const isFormValid = form.name.trim().length >= 2 && EMAIL_RE.test(form.email) && form.password.length >= 6;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat"
           style={{ backgroundImage: `url(${BG_URL})` }} />
      <div className="fixed inset-0"
           style={{ background: 'linear-gradient(135deg, rgba(26,43,74,0.88) 0%, rgba(26,43,74,0.72) 100%)' }} />

      <div className="relative z-10 w-full max-w-[400px]">

        {/* Logo */}
        <div className="bg-white rounded- p-8 border border-white/20"
             style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
          <div className="flex justify-center mb-8">
            <Logo size="lg" dark={false} />
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Create account
            </h2>
            <p className="text-text-secondary text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              Start planning your trips with WanderVault
            </p>
          </div>

          {serverError && (
            <div className="bg-danger-light text-danger p-6 rounded- mb-5 text-sm font-medium border border-danger/20 flex items-start gap-2"
                 role="alert" style={{ fontFamily: "'Inter', sans-serif" }}>
              <AlertTriangle size={14} strokeWidth={1.5} className="shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label htmlFor="register-name" className="block text-sm font-semibold text-navy mb-1.5"
                     style={{ fontFamily: "'Inter', sans-serif" }}>Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" strokeWidth={1.5} />
                <input type="text" id="register-name" name="name" required autoComplete="name"
                  placeholder="Your full name"
                  className={`w-full border rounded- pl-10 pr-6 py-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-bg text-navy transition-colors ${fieldErrors.name ? 'border-danger' : 'border-border focus:border-primary'}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={form.name} onChange={handleChange} disabled={loading} />
              </div>
              <FieldError msg={fieldErrors.name} />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-sm font-semibold text-navy mb-1.5"
                     style={{ fontFamily: "'Inter', sans-serif" }}>Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" strokeWidth={1.5} />
                <input type="email" id="register-email" name="email" required autoComplete="email"
                  placeholder="you@email.com"
                  className={`w-full border rounded- pl-10 pr-6 py-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-bg text-navy transition-colors ${fieldErrors.email ? 'border-danger' : 'border-border focus:border-primary'}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={form.email} onChange={handleChange} disabled={loading} />
              </div>
              <FieldError msg={fieldErrors.email} />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-sm font-semibold text-navy mb-1.5"
                     style={{ fontFamily: "'Inter', sans-serif" }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" strokeWidth={1.5} />
                <input type="password" id="register-password" name="password" required autoComplete="new-password"
                  placeholder="Min 6 characters"
                  className={`w-full border rounded- pl-10 pr-6 py-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-bg text-navy transition-colors ${fieldErrors.password ? 'border-danger' : 'border-border focus:border-primary'}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  value={form.password} onChange={handleChange} disabled={loading}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleSubmit(e); }}
                />
              </div>
              <FieldError msg={fieldErrors.password} />
              {form.password.length > 0 && (
                <p className="text-xs text-text-muted mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Strength:{' '}
                  <span className={form.password.length < 6 ? 'text-danger font-semibold' : form.password.length < 10 ? 'text-warning font-semibold' : 'text-success font-semibold'}>
                    {form.password.length < 6 ? 'Weak' : form.password.length < 10 ? 'Medium' : 'Strong'}
                  </span>
                </p>
              )}
            </div>

            <button type="submit" id="register-submit" disabled={loading || !isFormValid}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-6 rounded- transition-all duration-150 cursor-pointer border-0 text-sm mt-2"
              style={{ fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 14px rgba(255,107,53,0.4)' }}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded- animate-spin" />Creating account...</>
              ) : (
                <>Create Account <ArrowRight size={16} strokeWidth={2} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-semibold hover:underline no-underline">Sign in</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          WanderVault — Plan smarter, travel better
        </p>
      </div>
    </div>
  );
}