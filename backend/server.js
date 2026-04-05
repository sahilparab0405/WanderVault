const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');

const app = express();

connectDB();

// ─────────────────────────────────────────────────────────────
// CORS Configuration
//
// Root cause of the CORS error:
//   1. app.options('*', cors()) was called WITHOUT the options
//      object, so pre-flight responses had NO Allow-Origin header.
//   2. callback(new Error()) on blocked origins returned a 500
//      with NO CORS headers, making the browser misreport it.
//   3. axios was missing withCredentials:true while the server
//      was sending credentials:true — a mismatch that blocks cookies.
//
// Fix: define ONE shared corsOptions object and use it everywhere.
// ─────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://wandervault-frontend.vercel.app',
  'https://wandervault.vercel.app',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Return false (not an Error) so Express still sends a proper
    // HTTP response — just without the Allow-Origin header.
    // This avoids the misleading "CORS header values are valid" message.
    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,                                         // Allow cookies / Authorization header
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,                                 // Some browsers (IE11) choke on 204
};

// Apply to ALL routes (including pre-flight OPTIONS) — must be before routes.
// Note: app.use(cors()) automatically responds to OPTIONS pre-flight requests.
// A separate app.options() call is NOT needed and crashes on path-to-regexp v8+.
app.use(cors(corsOptions));

// ─────────────────────────────────────────────────────────────
// Body parsers
// ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/itinerary', itineraryRoutes);

// ─────────────────────────────────────────────────────────────
// Health check (useful for Render & uptime monitors)
// ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🌍 WanderVault API is running!', status: 'ok' });
});

// ─────────────────────────────────────────────────────────────
// 404 fallback
// ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─────────────────────────────────────────────────────────────
// Global error handler
// NOTE: Must be LAST — 4 arguments is what Express uses to detect
// error-handling middleware.
// ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  const statusCode = err.status || 500;
  res.status(statusCode).json({ message: err.message || 'Internal server error' });
});

// ─────────────────────────────────────────────────────────────
// Keep-alive ping every 14 minutes (prevents Render free-tier sleep)
// ─────────────────────────────────────────────────────────────
const KEEP_ALIVE_URL = 'https://wandervault-backend.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000;

const keepAlive = () => {
  fetch(KEEP_ALIVE_URL, { signal: AbortSignal.timeout(10000) })
    .then(r => console.log(`🏓 Keep-alive ping OK [${r.status}]`))
    .catch(e => console.warn('⚠️  Keep-alive ping failed:', e.message));
};

if (process.env.NODE_ENV !== 'development') {
  setInterval(keepAlive, PING_INTERVAL);
}

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));