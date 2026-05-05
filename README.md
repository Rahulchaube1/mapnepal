<p align="center">
  <span style="font-size:64px">🗺️</span>
</p>

<h1 align="center">EverestMap</h1>
<p align="center"><strong>Nepal's modern, open-source mapping platform</strong></p>
<p align="center">Built on MapLibre GL JS and OpenStreetMap data</p>

<p align="center">
  <img alt="Nepal Provinces Map" src="https://github.com/user-attachments/assets/dfe179f5-2ffe-4e7d-8e6f-f518e77c6e97" width="600">
</p>

<p align="center">
  <a href="LICENSE.txt"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat" alt="License"></a>
  <img src="https://img.shields.io/badge/EverestMap-Nepal%20Mapping-4299e1?style=flat" alt="EverestMap">
  <img src="https://img.shields.io/badge/Nepal-7%20Provinces-red?style=flat" alt="Nepal Provinces">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome">
</p>

> A next-generation open-source map of Nepal with province boundaries, trekking routes, smart search, and 3D terrain.

---

## 📸 Features

| Feature | Description |
|---------|-------------|
| 🏔️ **Nepal Provinces** | All 7 provinces rendered with blue choropleth fills, borders, bilingual labels (English + नेपाली), and hover / click info panels |
| 🥾 **Trekking Routes** | EBC, Annapurna Circuit, Langtang Valley, Manaslu Circuit — colour-coded with distance & altitude metadata |
| 📍 **Landmarks** | 15+ key cities, peaks, temples, lakes with icon overlays and popup descriptions |
| 🔍 **Smart Search** | Full-text search powered by Nominatim / OpenStreetMap; results fly-to on selection |
| 🌓 **Dark / Light Theme** | Instant theme switching — CartoDB Dark Matter (dark) / OpenFreeMap Bright (light) |
| 🗂️ **Layer Toggles** | Toggle provinces, trekking routes, and landmarks independently |
| ⛰️ **3D Terrain** | One-click 3D elevation exaggeration via Mapterhorn DEM tiles |
| 📐 **Navigation Controls** | Zoom, compass, pitch, full-screen, geolocation |
| 📱 **Responsive UI** | Collapsible sidebar; works on desktop and mobile |
| 🔌 **REST API Backend** | Node.js/Express server with geocoding, routing, and data endpoints |

---

## 🗺️ Nepal Province Map

EverestMap displays all 7 provinces of Nepal with a blue choropleth style, clearly showing provincial and district boundaries:

| # | Province | Capital | Population | Area (km²) | Districts |
|---|----------|---------|------------|------------|-----------|
| 1 | Koshi कोशी | Biratnagar | 4.53M | 25,905 | 14 |
| 2 | Madhesh मधेश | Janakpur | 6.13M | 9,661 | 8 |
| 3 | Bagmati बागमती | Hetauda | 6.08M | 20,300 | 13 |
| 4 | Gandaki गण्डकी | Pokhara | 2.40M | 21,504 | 11 |
| 5 | Lumbini लुम्बिनी | Butwal | 5.12M | 22,288 | 12 |
| 6 | Karnali कर्णाली | Surkhet | 1.69M | 27,984 | 10 |
| 7 | Sudurpashchim सुदूरपश्चिम | Dhangadhi | 2.55M | 19,539 | 9 |

---

## 🧱 Architecture

```
┌─────────────────────────────┐      ┌──────────────────────────────┐
│         Browser             │      │      EverestMap Backend       │
│                             │      │        (Node.js / Express)    │
│  ┌───────────────────────┐  │ HTTP │  ┌──────────────────────────┐ │
│  │  frontend/index.html  │◄─┼──────┼──│  GET /api/provinces      │ │
│  │                       │  │      │  │  GET /api/trekking-routes│ │
│  │  MapLibre GL JS 5.x   │  │      │  │  GET /api/landmarks      │ │
│  │  (map rendering)      │──┼──────┼─►│  GET /api/search         │ │
│  │                       │  │      │  │  GET /api/route          │ │
│  └───────────────────────┘  │      │  │  GET /api/reverse        │ │
│                             │      │  └──────────────────────────┘ │
└─────────────────────────────┘      │                               │
                                     │  ┌──────────────────────────┐ │
                                     │  │   data/                  │ │
                                     │  │   nepal-provinces.geojson│ │
                                     │  │   trekking-routes.geojson│ │
                                     │  │   landmarks.geojson      │ │
                                     │  └──────────────────────────┘ │
                                     └──────────────────────────────┘
                                              │           │
                                     ┌────────▼───┐  ┌────▼──────────┐
                                     │ Nominatim  │  │  OSRM routing │
                                     │ (search &  │  │  (directions) │
                                     │  reverse)  │  └───────────────┘
                                     └────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Map rendering | [MapLibre GL JS](https://maplibre.org/) 5.x |
| Base map tiles | [OpenFreeMap](https://openfreemap.org/) (light) · [CartoDB Dark Matter](https://carto.com/) (dark) |
| Terrain DEM | [Mapterhorn](https://mapterhorn.com/) raster-dem |
| Vector data | Inline GeoJSON (provinces, treks, landmarks) |
| Geocoding | [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/) |
| Routing | [OSRM demo server](https://router.project-osrm.org/) |
| Backend | Node.js 18+ / Express 4 |
| Styling | Custom CSS variables (dark/light), no framework dependencies |

---

## 🚀 Quick Start

### Option A — Frontend only (no server needed)

Open `everestmap/frontend/index.html` directly in any modern browser or serve it with any static file server:

```bash
# Using Node.js
npx serve everestmap/frontend

# Or using Python
python -m http.server -d everestmap/frontend 8080
```

Then navigate to **http://localhost:8080**.

---

### Option B — Full-stack (frontend + API backend)

**Prerequisites:** Node.js 18+ and npm 9+

```bash
# 1. Install backend dependencies
cd everestmap/backend
npm install

# 2. Start the server
npm start
# → Server running at http://localhost:3001

# 3. Open your browser
open http://localhost:3001
```

The backend serves the frontend from `/` and all API routes under `/api/*`.

**Development mode** (auto-restart on file changes):
```bash
npm run dev
```

---

## 📡 API Reference

All API endpoints are prefixed with `/api`.

### `GET /api/provinces`
Returns GeoJSON FeatureCollection with Nepal's 7 provinces including name, population, area, and description.

### `GET /api/trekking-routes`
Returns GeoJSON FeatureCollection with 4 classic trekking routes (EBC, Annapurna, Langtang, Manaslu).

### `GET /api/landmarks`
Returns GeoJSON FeatureCollection with 15+ major cities, peaks, temples, and natural landmarks.

### `GET /api/search?q=<query>[&limit=6]`
Geocodes a place name using Nominatim and returns a GeoJSON FeatureCollection.

**Example:**
```
GET /api/search?q=Pokhara
GET /api/search?q=सगरमाथा
```

### `GET /api/reverse?lat=<lat>&lng=<lng>`
Reverse geocodes coordinates to a human-readable address.

**Example:**
```
GET /api/reverse?lat=27.700&lng=85.317
```

### `GET /api/route?from=<lng,lat>&to=<lng,lat>[&mode=driving|walking|cycling]`
Returns a GeoJSON Feature with the route geometry and metadata (distance, duration).

**Example:**
```
GET /api/route?from=85.317,27.700&to=83.985,28.212&mode=driving
```

### `GET /health`
Server health check.

---

## 🗂️ Project Structure

```
everestmap/
├── README.md                   # EverestMap documentation
│
├── frontend/
│   └── index.html              # Complete single-page application
│                                 • MapLibre GL JS (CDN)
│                                 • Inline GeoJSON data
│                                 • Inline CSS (dark/light themes)
│                                 • Inline JS (map, search, UI)
│
├── backend/
│   ├── package.json            # Node.js dependencies
│   └── server.js               # Express API server
│
└── data/
    ├── nepal-provinces.geojson # 7 Nepal provinces with metadata
    ├── trekking-routes.geojson # 4 classic trekking routes
    └── landmarks.geojson       # 15+ landmarks, peaks, cities
```

---

## 🥾 Trekking Routes

| Trek | Distance | Duration | Max Altitude |
|------|----------|----------|--------------|
| Everest Base Camp | ~130 km | 14–18 days | 5,364 m |
| Annapurna Circuit | ~160 km | 12–21 days | 5,416 m |
| Langtang Valley | ~65 km | 7–10 days | 3,870 m |
| Manaslu Circuit | ~177 km | 14–18 days | 5,106 m |

---

## 🔭 Roadmap / Future Enhancements

- [ ] **PostGIS database** integration for dynamic geospatial queries
- [ ] **User authentication** — save favourite places and custom routes
- [ ] **Offline PWA** — service worker for tile caching
- [ ] **Voice navigation** — Web Speech API integration
- [ ] **AI assistant (EverestQ)** — natural language map queries
- [ ] **Disaster alert layer** — earthquake / flood overlays (USGS / BIPAD portal)
- [ ] **Satellite imagery toggle** — via TiTiler or Sentinel Hub
- [ ] **Real-time location sharing**
- [ ] **Custom style editor** — in-browser MapLibre style JSON editor
- [ ] **OpenMapTiles self-hosting** — replace CDN tiles with self-hosted vector tiles
- [ ] **AR navigation** placeholder

---

## 📜 License

Data: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL)  
Code: MIT — see [LICENSE.txt](LICENSE.txt)

---

## 🙏 Credits

- [MapLibre GL JS](https://maplibre.org/) — open-source map rendering engine
- [OpenFreeMap](https://openfreemap.org/) — free vector tile hosting
- [CartoDB Basemaps](https://carto.com/basemaps/) — dark base map tiles
- [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/) — geocoding
- [OSRM](https://project-osrm.org/) — open-source routing machine
- [Mapterhorn](https://mapterhorn.com/) — terrain DEM tiles
