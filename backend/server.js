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

// ── CORS — allow both local dev and production frontend ──────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://wandervault-frontend.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Pre-flight for all routes
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/itinerary', itineraryRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🌍 WanderVault API is running!', status: 'ok' });
});

// ── 404 fallback for unknown API routes ──────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  const statusCode = err.status || 500;
  res.status(statusCode).json({ message: err.message || 'Internal server error' });
});

// ── FIX 2: Keep-alive ping every 14 minutes (Render free tier) ──
const KEEP_ALIVE_URL = 'https://wandervault-backend.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes

const keepAlive = () => {
  fetch(KEEP_ALIVE_URL, { signal: AbortSignal.timeout(10000) })
    .then(res => console.log(`🏓 Keep-alive ping OK [${res.status}]`))
    .catch(err => console.warn('⚠️  Keep-alive ping failed:', err.message));
};

// Only ping in production (not local dev)
if (process.env.NODE_ENV !== 'development') {
  setInterval(keepAlive, PING_INTERVAL);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));