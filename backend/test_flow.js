const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'https://wandervault-backend.onrender.com';
const DUMMY_USER = {
  name: "Debug User Flow",
  email: `debug_flow_${Date.now()}@test.com`,
  password: "password123"
};

async function testAPI() {
  console.log("=== STEP 2: TEST API DIRECTLY ===");
  
  // 1. Register
  console.log(`\n--- [REQUEST] POST /api/auth/register ---`);
  console.log("Payload:", JSON.stringify(DUMMY_USER, null, 2));
  let registerRes;
  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DUMMY_USER)
    });
    
    // Check if 503 and wait
    if(res.status === 503) {
      console.log("Got 503, waiting 10s and retrying...");
      await new Promise(r => setTimeout(r, 10000));
      return await testAPI();
    }
    
    const textRes = await res.text();
    console.log(`\n--- [RESPONSE] STATUS ${res.status} ---`);
    console.log(textRes);
  } catch (err) {
    console.error("Register failed:", err.message);
  }

  // 2. Login
  console.log(`\n--- [REQUEST] POST /api/auth/login ---`);
  const loginPayload = { email: DUMMY_USER.email, password: DUMMY_USER.password };
  console.log("Payload:", JSON.stringify(loginPayload, null, 2));
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginPayload)
    });
    const textRes = await res.text();
    console.log(`\n--- [RESPONSE] STATUS ${res.status} ---`);
    console.log(textRes);
  } catch (err) {
    console.error("Login failed:", err.message);
  }

  console.log("\n=== STEP 3: MONGODB CHECK ===");
  try {
    await mongoose.connect(process.env.MONGO_URI);
    // User model
    const userSchema = new mongoose.Schema({ email: String }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    const dbUser = await User.findOne({ email: DUMMY_USER.email });
    if (dbUser) {
      console.log("\n--- [DATABASE ENTRY FOUND] ---");
      console.log(JSON.stringify(dbUser.toObject(), null, 2));
    } else {
      console.log("\n--- [DATABASE ENTRY NOT FOUND] ---");
    }
  } catch (err) {
    console.error("DB check failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

testAPI();
