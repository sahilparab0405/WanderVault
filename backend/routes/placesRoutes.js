const express = require('express');
const router = express.Router();
const https = require('https');
const { protect } = require('../middleware/authMiddleware');

/* ─── In-memory cache (survives request, resets on server restart) ─── */
const cache = {};
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

function getCacheKey(type, lat, lon) {
  // Round to 3 decimal places to avoid tiny GPS jitter creating different cache entries
  const rLat = parseFloat(lat).toFixed(3);
  const rLon = parseFloat(lon).toFixed(3);
  return `${type}_${rLat}_${rLon}`;
}

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const postData = query;
    const options = {
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'WanderVault/1.0 (travel planning app)',
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 429) {
        return reject({ status: 429, message: 'Overpass rate limited' });
      }
      if (res.statusCode !== 200) {
        return reject({ status: res.statusCode, message: 'Overpass error' });
      }

      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve(parsed);
        } catch (e) {
          reject({ status: 500, message: 'Invalid JSON from Overpass' });
        }
      });
    });

    req.on('error', (e) => reject({ status: 502, message: e.message }));
    req.setTimeout(25000, () => {
      req.destroy();
      reject({ status: 504, message: 'Overpass request timed out' });
    });

    req.write(postData);
    req.end();
  });
}

/* ─── GET /api/places/dining?lat=X&lon=Y ─── */
router.get('/dining', protect, async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ message: 'lat and lon are required' });

  const key = getCacheKey('dining', lat, lon);

  // Serve from cache if fresh
  if (cache[key] && Date.now() - cache[key].ts < CACHE_DURATION) {
    return res.json({ elements: cache[key].data, fromCache: true });
  }

  const query = `[out:json];(node["amenity"~"restaurant|cafe|fast_food"](around:5000,${lat},${lon});way["amenity"~"restaurant|cafe|fast_food"](around:5000,${lat},${lon}););out center qt limit 40;`;

  try {
    const data = await fetchOverpass(query);
    const elements = data.elements || [];
    cache[key] = { ts: Date.now(), data: elements };
    return res.json({ elements, fromCache: false });
  } catch (err) {
    if (err.status === 429) {
      // Cache empty result for 1 hour so frontend doesn't loop
      cache[key] = { ts: Date.now() - (5 * 60 * 60 * 1000), data: [] }; // 5h ago → expires in 1h
      return res.status(429).json({ message: 'Rate limited. Try again later.', elements: [] });
    }
    console.error('[placesRoutes] Dining fetch error:', err.message);
    return res.status(err.status || 500).json({ message: err.message, elements: [] });
  }
});

/* ─── GET /api/places/sightseeing?lat=X&lon=Y ─── */
router.get('/sightseeing', protect, async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ message: 'lat and lon are required' });

  const key = getCacheKey('sightseeing', lat, lon);

  if (cache[key] && Date.now() - cache[key].ts < CACHE_DURATION) {
    return res.json({ elements: cache[key].data, fromCache: true });
  }

  const query = `[out:json];(node["tourism"~"museum"](around:8000,${lat},${lon});way["tourism"~"museum"](around:8000,${lat},${lon});node["leisure"~"park|nature_reserve"](around:8000,${lat},${lon});way["leisure"~"park|nature_reserve"](around:8000,${lat},${lon});node["amenity"~"place_of_worship"](around:8000,${lat},${lon});way["amenity"~"place_of_worship"](around:8000,${lat},${lon});node["historic"~"monument|archaeological_site|castle"](around:8000,${lat},${lon});way["historic"~"monument|archaeological_site|castle"](around:8000,${lat},${lon});node["natural"~"beach"](around:8000,${lat},${lon});way["natural"~"beach"](around:8000,${lat},${lon}););out center qt limit 60;`;

  try {
    const data = await fetchOverpass(query);
    const elements = data.elements || [];
    cache[key] = { ts: Date.now(), data: elements };
    return res.json({ elements, fromCache: false });
  } catch (err) {
    if (err.status === 429) {
      cache[key] = { ts: Date.now() - (5 * 60 * 60 * 1000), data: [] };
      return res.status(429).json({ message: 'Rate limited. Try again later.', elements: [] });
    }
    console.error('[placesRoutes] Sightseeing fetch error:', err.message);
    return res.status(err.status || 500).json({ message: err.message, elements: [] });
  }
});

module.exports = router;
