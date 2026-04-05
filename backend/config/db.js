const mongoose = require('mongoose');

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10000, // 10s to find server
  socketTimeoutMS: 45000,          // 45s before socket times out
  connectTimeoutMS: 10000,         // 10s to establish connection
  maxPoolSize: 10,                 // max 10 connections in pool
  minPoolSize: 2,                  // keep at least 2 open
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Initial Connection Failed:', error.message);
    process.exit(1);
  }
};

// ── Auto-reconnect event listeners ──────────────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — attempting reconnect...');
  setTimeout(() => {
    mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS)
      .then(() => console.log('✅ MongoDB reconnected'))
      .catch(err => console.error('❌ Reconnect failed:', err.message));
  }, 5000); // wait 5 s before retrying
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

module.exports = connectDB;