import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/auth/register', form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

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

        {error && (
          <div
            className="bg-danger-light text-danger p-3 rounded-lg mb-4 text-sm font-medium border border-danger/20"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-navy mb-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="Sahil Parab"
              id="register-name"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
              style={{ fontFamily: "'Inter', sans-serif" }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-navy mb-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Email
            </label>
            <input
              type="email"
              required
              placeholder="you@email.com"
              id="register-email"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
              style={{ fontFamily: "'Inter', sans-serif" }}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-navy mb-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              id="register-password"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy"
              style={{ fontFamily: "'Inter', sans-serif" }}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            id="register-submit"
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors duration-150 cursor-pointer border-0 text-sm"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
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