const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const placesRoutes = require('./routes/placesRoutes');

const app = express();

connectDB();

const cors = require('cors');

app.use(cors({
  origin: [process.env.FRONTEND_URL || "https://wandervault-frontend.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/places', placesRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🌍 WanderVault API is running!', status: 'ok' });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  const statusCode = err.status || 500;
  res.status(statusCode).json({ message: err.message || 'Internal server error' });
});

// Keep-alive ping
const KEEP_ALIVE_URL = 'https://wandervault-backend.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000;

const keepAlive = () => {
  const https = require('https');
  https.get(KEEP_ALIVE_URL, (res) => {
    // Keep-alive ping successful
  }).on('error', (e) => {
    console.warn('⚠️  Keep-alive ping failed:', e.message);
  });
};

if (process.env.NODE_ENV !== 'development') {
  setInterval(keepAlive, PING_INTERVAL);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));