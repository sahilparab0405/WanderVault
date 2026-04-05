/**
 * axios.js — Centralised Axios instance for WanderVault API
 *
 * FIX 1:
 *  - Uses VITE_API_URL from env (falls back to localhost)
 *  - Attaches JWT token from localStorage on every request
 *  - Intercepts 401 responses → auto-logout + redirect to /login
 *
 * FIX 7 (Browser Compatibility):
 *  - No Chrome-specific APIs — uses standard Axios + localStorage
 */

import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 s — accounts for Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── REQUEST interceptor: attach token ────────────────────────
API.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage unavailable (private browsing edge case)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE interceptor: handle 401 token expiry ────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth state and redirect
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {
        // ignore storage errors
      }
      // Only redirect if not already on an auth page
      const { pathname } = window.location;
      if (pathname !== '/login' && pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;