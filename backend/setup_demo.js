/**
 * WanderVault Demo Account Setup Script
 * Creates demo@wandervault.com with 3 realistic trips
 * Run: node setup_demo.js
 */

const BASE = 'https://wandervault-backend.onrender.com/api';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} => ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log('🚀 WanderVault Demo Setup Starting...\n');

  // ────────────────────────────────────
  // STEP 1: Register or Login
  // ────────────────────────────────────
  let token;
  const creds = { name: 'Rahul Sharma', email: 'demo@wandervault.com', password: 'Demo@1234' };

  try {
    console.log('📝 Attempting registration...');
    const regData = await request('POST', '/auth/register', creds);
    token = regData.token;
    console.log('✅ Registered successfully! Token:', token.slice(0, 20) + '...');
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('400')) {
      console.log('ℹ️  User already exists, logging in...');
      const loginData = await request('POST', '/auth/login', { email: creds.email, password: creds.password });
      token = loginData.token;
      console.log('✅ Logged in! Token:', token.slice(0, 20) + '...');
    } else {
      throw err;
    }
  }

  // ────────────────────────────────────
  // Check existing trips and clean up
  // ────────────────────────────────────
  console.log('\n🔍 Checking existing trips...');
  const existingTrips = await request('GET', '/trips', null, token);
  console.log(`   Found ${existingTrips.length} existing trip(s).`);

  // Delete existing demo trips to start fresh
  for (const trip of existingTrips) {
    console.log(`   🗑️  Deleting: "${trip.name}"`);
    await request('DELETE', `/trips/${trip._id}`, null, token);
  }
  console.log('   ✅ Cleaned up existing trips.\n');

  // ────────────────────────────────────
  // TRIP 1: Goa Beach Vacation (Last month, 5 days)
  // ────────────────────────────────────
  console.log('🏖️  Creating Trip 1: Goa Beach Vacation...');
  const goaTrip = await request('POST', '/trips', {
    name: 'Goa Beach Vacation',
    destination: 'Goa, India',
    latitude: 15.4909,
    longitude: 73.8278,
    travelMode: 'flight',
    startDate: daysAgo(35),
    endDate: daysAgo(31),
    budget: 25000,
    accommodation: []
  }, token);
  console.log(`   ✅ Trip created: ${goaTrip._id}`);

  // Add expenses for Goa
  const goaExpenses = [
    { title: 'Flight tickets', amount: 8000, category: 'Transport' },
    { title: 'Hotel Calangute', amount: 6000, category: 'Hotel' },
    { title: 'Beach activities', amount: 2500, category: 'Activities' },
    { title: 'Seafood dinner', amount: 3000, category: 'Food' },
    { title: 'Shopping', amount: 2000, category: 'Shopping' },
  ];

  for (const exp of goaExpenses) {
    await request('POST', `/expenses/${goaTrip._id}`, { ...exp, date: daysAgo(33) }, token);
    console.log(`   💸 Added expense: ${exp.title} (₹${exp.amount})`);
  }

  // Add itinerary for Goa
  const goaItinerary = [
    { day: 1, title: 'Arrive + Check in hotel', location: 'Calangute, Goa', description: 'Reach Goa Airport, transfer to hotel. Evening walk on Calangute Beach.' },
    { day: 2, title: 'Baga Beach + Water sports', location: 'Baga Beach, Goa', description: 'Parasailing, jet ski, banana boat ride. Evening at Tito\'s Lane.' },
    { day: 3, title: 'Old Goa Churches', location: 'Old Goa', description: 'Visit Basilica of Bom Jesus and Se Cathedral. Lunch at a local Goan restaurant.' },
    { day: 4, title: 'Anjuna Flea Market', location: 'Anjuna, Goa', description: 'Browse the famous Wednesday flea market. Buy souvenirs and local handicrafts.' },
    { day: 5, title: 'Departure', location: 'Dabolim Airport, Goa', description: 'Morning checkout, last beach walk. Head to airport for return flight.' },
  ];

  for (const item of goaItinerary) {
    await request('POST', `/itinerary/${goaTrip._id}`, item, token);
    console.log(`   📅 Added Day ${item.day}: ${item.title}`);
  }
  console.log('   ✅ Goa trip complete! Total: ₹21,500 / ₹25,000 budget\n');

  // ────────────────────────────────────
  // TRIP 2: Mumbai Business Trip (This week, 3 days, OVER BUDGET)
  // ────────────────────────────────────
  console.log('🏙️  Creating Trip 2: Mumbai Business Trip...');
  const mumbaiTrip = await request('POST', '/trips', {
    name: 'Mumbai Business Trip',
    destination: 'Mumbai, India',
    latitude: 19.0760,
    longitude: 72.8777,
    travelMode: 'train',
    startDate: daysAgo(1),
    endDate: daysFromNow(1),
    budget: 12000,
    accommodation: []
  }, token);
  console.log(`   ✅ Trip created: ${mumbaiTrip._id}`);

  // Add expenses for Mumbai — OVER BUDGET (₹13,500 > ₹12,000)
  const mumbaiExpenses = [
    { title: 'Train ticket', amount: 2500, category: 'Transport' },
    { title: 'Hotel BKC', amount: 8000, category: 'Hotel' },
    { title: 'Client dinner', amount: 3000, category: 'Food' },
  ];

  for (const exp of mumbaiExpenses) {
    const result = await request('POST', `/expenses/${mumbaiTrip._id}`, { ...exp, date: daysAgo(1) }, token);
    console.log(`   💸 Added expense: ${exp.title} (₹${exp.amount})${result.budgetExceeded ? ' 🔴 BUDGET EXCEEDED!' : ''}`);
  }

  // Add itinerary for Mumbai
  const mumbaiItinerary = [
    { day: 1, title: 'Arrive + Check in', location: 'Mumbai Central, Mumbai', description: 'Arrive by train at Mumbai Central. Check in at BKC hotel. Evening prep for meetings.' },
    { day: 2, title: 'Client meetings BKC', location: 'BKC, Mumbai', description: 'Full day client meetings at Bandra Kurla Complex. Working lunch. Evening at Marine Drive.' },
    { day: 3, title: 'Site visit + Departure', location: 'Andheri, Mumbai', description: 'Morning site visit at Andheri office. Wrap up project docs. Board return train.' },
  ];

  for (const item of mumbaiItinerary) {
    await request('POST', `/itinerary/${mumbaiTrip._id}`, item, token);
    console.log(`   📅 Added Day ${item.day}: ${item.title}`);
  }
  console.log('   🔴 Mumbai trip OVER BUDGET! ₹13,500 / ₹12,000 (₹1,500 over)\n');

  // ────────────────────────────────────
  // TRIP 3: Rajasthan Heritage Tour (Next month, 7 days, upcoming)
  // ────────────────────────────────────
  console.log('🏰 Creating Trip 3: Rajasthan Heritage Tour...');
  const rajTrip = await request('POST', '/trips', {
    name: 'Rajasthan Heritage Tour',
    destination: 'Jaipur, Rajasthan',
    latitude: 26.9124,
    longitude: 75.7873,
    travelMode: 'flight',
    startDate: daysFromNow(30),
    endDate: daysFromNow(36),
    budget: 40000,
    accommodation: []
  }, token);
  console.log(`   ✅ Trip created: ${rajTrip._id}`);

  // No expenses for Rajasthan (upcoming trip)

  // Add itinerary for Rajasthan
  const rajItinerary = [
    { day: 1, title: 'Amber Fort', location: 'Amber Fort, Jaipur', description: 'Take an elephant ride up to Amber Fort. Explore Sheesh Mahal and Sukh Niwas.' },
    { day: 2, title: 'City Palace + Hawa Mahal', location: 'City Palace, Jaipur', description: 'Tour the City Palace museum. Walk to Hawa Mahal for photos. Evening at Jantar Mantar.' },
    { day: 3, title: 'Jantar Mantar + Bazaars', location: 'Johari Bazaar, Jaipur', description: 'Visit the astronomical instruments. Shop at Johari Bazaar for gemstones and textiles.' },
  ];

  for (const item of rajItinerary) {
    await request('POST', `/itinerary/${rajTrip._id}`, item, token);
    console.log(`   📅 Added Day ${item.day}: ${item.title}`);
  }
  console.log('   ✅ Rajasthan trip complete! No expenses yet (upcoming)\n');

  // ────────────────────────────────────
  // FINAL VERIFICATION
  // ────────────────────────────────────
  console.log('═══════════════════════════════════════');
  console.log('🎯 VERIFICATION');
  console.log('═══════════════════════════════════════');
  
  const finalTrips = await request('GET', '/trips', null, token);
  console.log(`\n📊 Total trips: ${finalTrips.length}`);
  
  for (const t of finalTrips) {
    const status = t.budgetExceeded ? '🔴 OVER BUDGET' : '🟢 Within budget';
    console.log(`   ${status} | ${t.name} | ₹${t.totalExpense.toLocaleString()} / ₹${t.budget.toLocaleString()}`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('✅ DEMO SETUP COMPLETE!');
  console.log('═══════════════════════════════════════');
  console.log(`\n🔑 Login credentials:`);
  console.log(`   Email:    demo@wandervault.com`);
  console.log(`   Password: Demo@1234`);
  console.log(`\n🌐 Live URL: https://wandervault-frontend.vercel.app`);
  console.log(`\n📋 Dashboard should show:`);
  console.log(`   - 3 trip cards`);
  console.log(`   - 1 red (over budget) card — Mumbai Business Trip`);
  console.log(`   - Goa with ₹21,500 spent`);
  console.log(`   - Mumbai with ₹13,500 spent (OVER ₹12,000 budget)`);
  console.log(`   - Rajasthan with ₹0 spent (future trip)`);
}

main().catch(err => {
  console.error('\n❌ FATAL ERROR:', err.message);
  process.exit(1);
});
