# SOLARIS — Space Weather Command Center

A real-time space weather dashboard displaying solar wind, Kp index, solar flares, and NOAA alerts for a user-selected location. Aurora visibility is calculated from live Kp data and the user's latitude.

To learn about Space Weather data, visit the NOAA website [here](https://www.swpc.noaa.gov/about-space-weather)

## Prerequisites

- **Node.js** 22 LTS or later
- **pnpm** 10 or later (`npm install -g pnpm`) [other install options](https://pnpm.io/installation)

## Setup

```bash
# 1. Install all dependencies (from project root)
pnpm install

# 2. Start both apps in parallel (web :3000, api :4000) (from project root)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.  
API documentation (Swagger UI) is available at [http://localhost:4000/api/docs](http://localhost:4000/api/docs).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start frontend + backend in parallel (hot-reload) |
| `pnpm build` | Production build of all packages |
| `pnpm test` | Run all unit tests |
| `pnpm lint` | Lint all packages |

To target a single package:

```bash
pnpm -F @repo/frontend dev
pnpm -F @repo/backend dev
pnpm -F @repo/backend test
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (:3000)                   │
│  React 19 + Vite 6                                  │
│  TanStack Query  →  /api/*  (Vite proxy)            │
└──────────────────────────┬──────────────────────────┘
                           │ HTTP (proxied)
┌──────────────────────────▼──────────────────────────┐
│                  API Server (:4000)                 │
│  NestJS 11 · GlobalPrefix: /api                     │
│                                                     │
│  /api/space-weather/solar-wind  ─┐                  │
│  /api/space-weather/kp          ─┤─ SpaceWeatherSvc │
│  /api/space-weather/flares      ─┤   → NOAA SWPC   │
│  /api/space-weather/alerts      ─┘                  │
│                                                     │
│  /api/geocode/search   ─┐                           │
│  /api/geocode/reverse  ─┴─ GeocodeSvc               │
│                             → Nominatim OSM         │
│                                                     │
│  Swagger UI: /api/docs                              │
└─────────────────────────────────────────────────────┘
```

**Data flow:**
1. On load the user selects a location via forward geocode (Nominatim).
2. TanStack Query fetches all four space-weather endpoints and refreshes every 5 minutes.
3. Aurora visibility is derived client-side from live Kp and the user's latitude — no additional API call.

## Environment Variables

### `apps/api/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Port the NestJS API listens on |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin for the frontend |
| `VITE_API_BASE_URL` |  '' | API domain base URL used by client side requests

No API keys are required — NOAA SWPC and Nominatim are free, open data sources.

## Project Structure

```
curly-octo-giggle/
├── apps/
│   ├── web/          # @repo/frontend  — React 19 + Vite 6 (port 3000)
│   └── api/          # @repo/backend   — NestJS 11 (port 4000)
├── packages/
│   └── shared/       # @repo/shared    — Shared TypeScript types
├── pnpm-workspace.yaml
└── package.json
```
