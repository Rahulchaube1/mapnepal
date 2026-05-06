/**
 * EverestMap — Express API Server
 *
 * Endpoints:
 *  GET  /api/provinces          - Nepal province GeoJSON
 *  GET  /api/trekking-routes    - Trekking routes GeoJSON
 *  GET  /api/landmarks          - Nepal landmarks GeoJSON
 *  GET  /api/search?q=<query>   - Nominatim geocoding proxy
 *  GET  /api/route?from=lng,lat&to=lng,lat&mode=driving|walking
 *                               - OSRM routing proxy
 *  GET  /api/reverse?lat=&lng=  - Reverse geocoding proxy (Nominatim)
 *  GET  /health                 - Server health check
 */

import express        from 'express';
import cors           from 'cors';
import fetch          from 'node-fetch';
import rateLimit      from 'express-rate-limit';
import path           from 'path';
import { fileURLToPath } from 'url';
import { readFileSync }  from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.join(__dirname, '..', 'data');
const PORT      = process.env.PORT || 3001;

/* ── Helpers ─────────────────────────────────────────────────── */

/** Load a local GeoJSON file (sync, cached). */
const cache = {};
function loadGeoJSON(filename) {
    if (cache[filename]) return cache[filename];
    const raw  = readFileSync(path.join(DATA_DIR, filename), 'utf8');
    cache[filename] = JSON.parse(raw);
    return cache[filename];
}

/* ── App setup ───────────────────────────────────────────────── */
const app = express();

/* ── Rate limiting ───────────────────────────────────────────── */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute window
    max: 120,              // max 120 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const searchLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute window
    max: 30,              // search is heavier; limit to 30 req/min
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Search rate limit exceeded, please try again shortly.' }
});

app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);
app.use('/api/search',  searchLimiter);
app.use('/api/reverse', searchLimiter);

/* Serve frontend at root */
app.use(express.static(path.join(__dirname, '..', 'frontend')));
/* Serve data folder statically */
app.use('/data', express.static(path.join(__dirname, '..', 'data')));

/* ──────────────────────────────────────────────────────────────
   DATA ENDPOINTS
   ────────────────────────────────────────────────────────────── */

/** Nepal provinces GeoJSON (Updated with Lipulekh/Kalapani/Limpiyadhura) */
app.get('/api/provinces', (_req, res) => {
    res.json(loadGeoJSON('nepal_updated.geojson'));
});

/** Trekking routes GeoJSON */
app.get('/api/trekking-routes', (_req, res) => {
    res.json(loadGeoJSON('trekking-routes.geojson'));
});

/** Landmarks GeoJSON */
app.get('/api/landmarks', (_req, res) => {
    res.json(loadGeoJSON('landmarks.geojson'));
});

/* ──────────────────────────────────────────────────────────────
   SEARCH ENDPOINT (Nominatim proxy)
   ────────────────────────────────────────────────────────────── */

/**
 * GET /api/search?q=<query>[&limit=6]
 * Proxies Nominatim forward geocoding and returns GeoJSON FeatureCollection.
 */
app.get('/api/search', async (req, res) => {
    const query = String(req.query.q || '').trim();
    const limit = Math.min(Number(req.query.limit) || 6, 10);

    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter "q"' });
    }

    const nominatimUrl =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(query)}` +
        `&format=geojson&limit=${limit}&addressdetails=1`;

    try {
        const upstream = await fetch(nominatimUrl, {
            headers: { 'User-Agent': 'EverestMap/1.0 (https://github.com/Rahulchaube1/mapnepal)' }
        });
        if (!upstream.ok) throw new Error(`Nominatim responded ${upstream.status}`);
        const data = await upstream.json();
        res.json(data);
    } catch (err) {
        console.error('[search] error:', err.message);
        res.status(502).json({ error: 'Search service unavailable', details: err.message });
    }
});

/* ──────────────────────────────────────────────────────────────
   REVERSE GEOCODING ENDPOINT (Nominatim proxy)
   ────────────────────────────────────────────────────────────── */

/**
 * GET /api/reverse?lat=<lat>&lng=<lng>
 * Returns a human-readable address for the given coordinates.
 */
app.get('/api/reverse', async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Invalid or missing lat/lng parameters' });
    }

    const url =
        `https://nominatim.openstreetmap.org/reverse` +
        `?lat=${lat}&lon=${lng}&format=json`;

    try {
        const upstream = await fetch(url, {
            headers: { 'User-Agent': 'EverestMap/1.0 (https://github.com/Rahulchaube1/mapnepal)' }
        });
        if (!upstream.ok) throw new Error(`Nominatim responded ${upstream.status}`);
        const data = await upstream.json();
        res.json({
            display_name: data.display_name,
            address: data.address,
            coordinates: { lat, lng }
        });
    } catch (err) {
        console.error('[reverse] error:', err.message);
        res.status(502).json({ error: 'Reverse geocoding unavailable', details: err.message });
    }
});

/* ──────────────────────────────────────────────────────────────
   ROUTING ENDPOINT (OSRM proxy)
   ────────────────────────────────────────────────────────────── */

const OSRM_PROFILES = {
    driving: 'driving',
    walking: 'foot',
    cycling: 'cycling'
};

/**
 * GET /api/route?from=lng,lat&to=lng,lat[&mode=driving|walking|cycling]
 * Proxies OSRM demo server and returns a simplified route response.
 */
app.get('/api/route', async (req, res) => {
    const fromStr  = String(req.query.from || '');
    const toStr    = String(req.query.to   || '');
    const mode     = OSRM_PROFILES[req.query.mode] || 'driving';

    const [fromLng, fromLat] = fromStr.split(',').map(Number);
    const [toLng,   toLat]   = toStr.split(',').map(Number);

    if ([fromLng, fromLat, toLng, toLat].some(isNaN)) {
        return res.status(400).json({ error: 'Invalid from/to coordinates. Expected "lng,lat".' });
    }

    const osrmUrl =
        `https://router.project-osrm.org/route/v1/${mode}` +
        `/${fromLng},${fromLat};${toLng},${toLat}` +
        `?overview=full&geometries=geojson&steps=false&annotations=false`;

    try {
        const upstream = await fetch(osrmUrl, {
            headers: { 'User-Agent': 'EverestMap/1.0' }
        });
        if (!upstream.ok) throw new Error(`OSRM responded ${upstream.status}`);
        const data = await upstream.json();

        if (!data.routes || !data.routes.length) {
            return res.status(404).json({ error: 'No route found between the specified points' });
        }

        const route = data.routes[0];
        res.json({
            type: 'Feature',
            properties: {
                distance_m:   route.distance,
                duration_s:   route.duration,
                distance_km:  (route.distance / 1000).toFixed(1),
                duration_min: Math.ceil(route.duration / 60),
                mode
            },
            geometry: route.geometry
        });
    } catch (err) {
        console.error('[route] error:', err.message);
        res.status(502).json({ error: 'Routing service unavailable', details: err.message });
    }
});

/* ──────────────────────────────────────────────────────────────
   HEALTH CHECK
   ────────────────────────────────────────────────────────────── */
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'EverestMap API',
        version: '1.2.0',
        license: 'MIT',
        copyright: '© 2025 EverestMap Project. All rights reserved.',
        timestamp: new Date().toISOString()
    });
});

/* Fallback: serve frontend for any unmatched GET */
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

/* ── Start ───────────────────────────────────────────────────── */
app.listen(PORT, () => {
    console.log(`\n🗺️  EverestMap API running at http://localhost:${PORT}`);
    console.log(`   Frontend:  http://localhost:${PORT}/`);
    console.log(`   Provinces: http://localhost:${PORT}/api/provinces`);
    console.log(`   Search:    http://localhost:${PORT}/api/search?q=Kathmandu`);
    console.log(`   Route:     http://localhost:${PORT}/api/route?from=85.317,27.700&to=83.985,28.212&mode=driving`);
    console.log(`   Health:    http://localhost:${PORT}/health\n`);
});
