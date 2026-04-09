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
// CORS Configuration — explicit origin list, no wildcard
// app.options() is NOT used — cors() middleware handles preflight
// ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://wandervault-frontend.vercel.app',
    'https://wandervault.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

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
// Health check
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
// Global error handler (4 args = Express error middleware)
// ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
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
  const https = require('https');
  https.get(KEEP_ALIVE_URL, (res) => {
    console.log(`🏓 Keep-alive ping OK [${res.statusCode}]`);
  }).on('error', (e) => {
    console.warn('⚠️  Keep-alive ping failed:', e.message);
  });
};

if (process.env.NODE_ENV !== 'development') {
  setInterval(keepAlive, PING_INTERVAL);
}

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));