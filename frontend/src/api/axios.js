/**
 * axios.js — Centralised Axios instance for WanderVault API
 *
 * CORS FIX: withCredentials must be true when the backend sends
 * Access-Control-Allow-Credentials: true. Without it, the browser
 * strips cookies and the backend rejects the request — both sides
 * must agree or neither work.
 */

import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,         // 15 s — covers Render cold-start delay
  withCredentials: true,  // !! REQUIRED when backend uses credentials:true !!
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── REQUEST interceptor: attach JWT token ─────────────────────
API.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage unavailable (private browsing / Edge quirk)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE interceptor: 401 → auto-logout ──────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {
        // ignore
      }
      const { pathname } = window.location;
      if (pathname !== '/login' && pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;