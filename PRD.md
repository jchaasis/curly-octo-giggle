# SOLARIS — Space Weather Command Center
## Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** April 8, 2026  
**Status:** Draft

---

## 1. Executive Summary

SOLARIS is a real-time space weather monitoring web application that surfaces live data from NOAA's Space Weather Prediction Center (SWPC) in a mission-control-inspired dashboard. The product targets software engineers, space weather enthusiasts, aurora chasers, and technically curious users who want to understand current solar activity without navigating NOAA's utilitarian government interfaces.

The application fetches live planetary Kp index, solar wind plasma and magnetometer data, solar flare history, and NOAA alert feeds — then presents them through a cohesive dark-mode UI with animated visualizations, a custom SVG arc gauge, and a location-aware aurora visibility calculator. Users enter their city or allow GPS access, and SOLARIS immediately contextualizes global space weather data against their specific latitude.

The MVP goal is a production-ready, fully responsive single-page application running in a pnpm monorepo, with a React/Vite frontend backed by a NestJS API layer that proxies and caches NOAA data, eliminating CORS limitations and providing a stable internal API contract.

---

## 2. Mission

**Mission Statement:** Make space weather legible — transforming raw NOAA telemetry into a beautiful, instantly understandable command-center experience that tells you what the sun is doing right now and what it means for your location.

### Core Principles

1. **Data fidelity first** — Every number on screen traces directly to a NOAA source endpoint. No interpolation, no fabrication, clear fallback states when data is unavailable.
2. **Location makes it personal** — Global space weather data is contextualized to the user's latitude. The same Kp value means different things in Fairbanks vs. Charlotte.
3. **Resilience over brittleness** — NOAA endpoints vary in format and availability. The system degrades gracefully with fallbacks, format-agnostic parsers, and clear "no data" states rather than silent failures.
4. **Performance by default** — The backend caches NOAA responses to respect upstream rate limits and keep the UI snappy. The frontend never blocks on data it doesn't have yet.
5. **Interview-ready craft** — Code quality, architecture, and UI polish should reflect the standard of a senior engineer's take-home submission: clean, tested, well-structured, and explainable.

---

## 3. Target Users

### Primary Persona — The Technically Curious Engineer
- **Profile:** Software engineer or developer, 25–45, drawn to the project as a portfolio piece or genuine interest in space science
- **Technical comfort:** High — comfortable reading JSON APIs, understands HTTP caching, can appreciate clean architecture
- **Needs:** A working app that demonstrates real API integration, responsive design, and solid engineering judgment
- **Pain points:** Existing space weather sites are either too academic (raw data dumps) or too simplified (just a Kp number with no context)

### Secondary Persona — The Aurora Chaser
- **Profile:** Hobbyist photographer or traveler who monitors geomagnetic activity to plan aurora viewing trips
- **Technical comfort:** Medium — knows what Kp means, has used SpaceWeatherLive or similar tools
- **Needs:** Quick answer to "can I see the aurora tonight from where I am?"
- **Pain points:** Current tools require cross-referencing multiple pages to connect current Kp to their specific latitude

### Tertiary Persona — The Space Weather Enthusiast
- **Profile:** Amateur scientist or ham radio operator, interested in solar flares and geomagnetic storms
- **Technical comfort:** Medium–high — understands solar wind parameters, Bz polarity significance
- **Needs:** Real-time solar wind data, flare history, alert feed
- **Pain points:** NOAA's official interface is functional but dated and not mobile-friendly

---

## 4. MVP Scope

### Core Functionality

- [x] Location entry modal (city search via Nominatim geocoding)
- [x] GPS-based location detection as fallback
- [x] Live solar wind display (speed, density, Bz, temperature)
- [x] Solar wind sparkline chart (last 80 readings)
- [x] Planetary Kp index gauge (SVG arc, animated needle)
- [x] Kp storm level labeling (Quiet → Extreme Storm G5)
- [x] 7-day solar flare history with class-coded colors (A/B/C/M/X)
- [x] Active flare class badge on sun visualization
- [x] Aurora visibility calculator (latitude vs. Kp threshold)
- [x] Aurora status bar with 6-tier labeling
- [x] NOAA alert ticker (scrolling marquee)
- [x] Animated sun visualization with solar flare pulses
- [x] Starfield canvas background
- [x] Live UTC clock
- [x] Auto-refresh every 90 seconds
- [x] Manual sync button
- [x] Location switcher in header
- [x] Responsive layout (1024px, 768px, 480px breakpoints)

### Technical

- [x] Monorepo with pnpm workspaces
- [x] NestJS backend proxying all NOAA endpoints
- [x] `HttpClientModule` with `INoaaClient` / `INominatimClient` interfaces (transport abstraction)
- [x] Response caching on backend (TTL aligned to NOAA update frequency)
- [x] Format-agnostic NOAA data parsers (array-of-arrays + array-of-objects)
- [x] Primary + fallback endpoint strategy for Kp data
- [x] OpenAPI/Swagger spec via `@nestjs/swagger` (all DTOs and responses annotated)
- [x] Vitest unit tests for data parsing and aurora calc logic
- [x] TypeScript throughout (strict mode)

### Out of Scope (Future Phases)

- [ ] User accounts and saved locations
- [ ] Push notifications / email alerts for storm thresholds
- [ ] Historical data charts (30-day, solar cycle)
- [ ] Aurora forecast map (OVATION model overlay)
- [ ] CME (coronal mass ejection) tracker
- [ ] Dark sky / light pollution overlay
- [ ] Native mobile app (iOS/Android)
- [ ] WebSocket real-time streaming (replace polling)
- [ ] Multi-language support
- [ ] Offline / PWA support
- [ ] Social sharing of current conditions

---

## 5. User Stories

### US-01 — Location Setup
**As a** first-time visitor,  
**I want to** enter my city name or use my device's GPS,  
**so that** the dashboard immediately contextualizes space weather data to my latitude without me having to look up coordinates.

> *Example: User types "Charlotte, NC" → app geocodes via Nominatim → dashboard populates with aurora visibility specific to 35.2° N*

---

### US-02 — Aurora Visibility at a Glance
**As an** aurora chaser,  
**I want to** see immediately whether aurora is visible from my location tonight,  
**so that** I can decide whether to drive out to a dark sky site without cross-referencing multiple tools.

> *Example: Kp=6 in Anchorage (64° N, requires Kp≥1) → shows "HIGH VISIBILITY — LOOK UP!" in green. Kp=6 in Charlotte (35° N, requires Kp≥9) → shows "NOT VISIBLE FROM THIS LATITUDE" in red.*

---

### US-03 — Solar Wind Monitoring
**As a** space weather enthusiast,  
**I want to** see live solar wind speed, density, Bz (GSM), and temperature,  
**so that** I can assess whether current conditions are likely to produce geomagnetic activity.

> *Example: Bz = −12 nT (southward, colored red) with speed 650 km/s signals an incoming geomagnetic storm. Bz = +4 nT (northward, green) indicates quiet conditions.*

---

### US-04 — Geomagnetic Storm Level
**As a** user tracking space weather,  
**I want to** see the current planetary Kp index on a clear visual gauge with a storm severity label,  
**so that** I instantly understand whether conditions are quiet, unsettled, or stormy without knowing the Kp scale by heart.

> *Example: Kp=5 renders gauge arc in orange, needle pointing past midpoint, label reads "MINOR STORM (G1)"*

---

### US-05 — Recent Solar Flare History
**As a** space weather enthusiast,  
**I want to** browse the last 7 days of solar flares sorted by recency with their class and timing,  
**so that** I can understand the recent activity level of the sun and correlate flares with geomagnetic events.

> *Example: X1.2 flare at 14:32 UTC on Apr 5 followed by Kp spike on Apr 7 — visible in the flare list and Kp gauge history*

---

### US-06 — NOAA Alert Awareness
**As a** user,  
**I want to** see active NOAA space weather alerts scrolling in a ticker at the bottom of the screen,  
**so that** I'm aware of any watches, warnings, or summaries SWPC has issued without navigating to a separate page.

---

### US-07 — Location Switching
**As a** user with family in multiple locations,  
**I want to** switch my location at any time without reloading the page,  
**so that** I can check aurora visibility for different cities in the same session.

> *Example: Check conditions for Tromsø, Norway (aurora hotspot) then switch to check home in Denver, CO*

---

### US-08 — Responsive Mobile Experience
**As a** user checking space weather on my phone,  
**I want to** see all key data without horizontal scrolling or broken layouts,  
**so that** I can quickly check conditions while out in the field scouting aurora locations.

---

### US-09 — Technical: Data Freshness
**As a** developer or power user,  
**I want to** see the UTC timestamp of the last data sync and trigger a manual refresh,  
**so that** I know how current the displayed data is and can force-update when needed.

---

## 6. Core Architecture & Patterns

### High-Level Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  React SPA (Vite)                           │
│  - Dashboard UI                             │
│  - Location modal                           │
│  - Canvas visualizations                    │
│  - SVG gauge                                │
└──────────────┬──────────────────────────────┘
               │ HTTP (internal REST)
┌──────────────▼──────────────────────────────┐
│         NestJS API (Node.js)                │
│  - /space-weather/solar-wind                │
│  - /space-weather/kp                        │
│  - /space-weather/flares                    │
│  - /space-weather/alerts                    │
│  - /geocode/search                          │
│  - In-memory cache (TTL per endpoint)       │
└──────────────┬──────────────────────────────┘
               │ HTTP (proxied)
┌──────────────▼──────────────────────────────┐
│         External APIs                        │
│  NOAA SWPC  services.swpc.noaa.gov          │
│  Nominatim  nominatim.openstreetmap.org      │
└─────────────────────────────────────────────┘
```

### Monorepo Directory Structure

```
solaris/
├── package.json                  # Root pnpm workspace config
├── pnpm-workspace.yaml
├── .npmrc
├── tsconfig.base.json            # Shared TS config
├── apps/
│   ├── web/                      # React + Vite frontend
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── vitest.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── components/
│   │       │   ├── ui/                    # shadcn/ui components
│   │       │   ├── Header/
│   │       │   ├── SunPanel/
│   │       │   ├── SolarWindCard/
│   │       │   │   ├── SolarWindCard.tsx        # Container: owns useSpaceWeather
│   │       │   │   └── SolarWindCardDisplay.tsx  # Display: pure primitive props
│   │       │   ├── KpGauge/
│   │       │   │   ├── KpGaugeContainer.tsx     # Container: owns useSpaceWeather
│   │       │   │   └── KpGauge.tsx              # Display: pure primitive props
│   │       │   ├── FlareList/
│   │       │   │   ├── FlareListContainer.tsx
│   │       │   │   └── FlareList.tsx
│   │       │   ├── AuroraCard/
│   │       │   │   ├── AuroraCardContainer.tsx
│   │       │   │   └── AuroraCard.tsx
│   │       │   ├── AlertTicker/
│   │       │   │   ├── AlertTickerContainer.tsx
│   │       │   │   └── AlertTicker.tsx
│   │       │   └── LocationModal/
│   │       ├── hooks/
│   │       │   ├── useSpaceWeather.ts
│   │       │   ├── useLocation.ts
│   │       │   └── useAutoRefresh.ts
│   │       ├── lib/
│   │       │   ├── aurora.ts     # Kp-to-latitude threshold logic
│   │       │   └── formatters.ts
│   │       ├── services/
│   │       │   └── api.ts        # Typed fetch client
│   │       ├── stores/           # Zustand or Context state
│   │       └── types/
│   │           └── space-weather.ts
│   └── api/                      # NestJS backend
│       ├── package.json
│       ├── tsconfig.json
│       ├── nest-cli.json
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── infrastructure/
│           │   └── clients/
│           │       ├── http-client.module.ts   # Transport config, retry, timeout
│           │       ├── noaa.client.ts          # INoaaClient implementation
│           │       └── nominatim.client.ts     # INominatimClient implementation
│           ├── space-weather/
│           │   ├── space-weather.module.ts
│           │   ├── space-weather.controller.ts
│           │   ├── space-weather.service.ts
│           │   ├── parsers/
│           │   │   ├── plasma.parser.ts
│           │   │   ├── mag.parser.ts
│           │   │   └── kp.parser.ts
│           │   └── dto/
│           │       ├── solar-wind.dto.ts
│           │       └── kp.dto.ts
│           ├── geocode/
│           │   ├── geocode.module.ts
│           │   ├── geocode.controller.ts
│           │   └── geocode.service.ts
│           └── cache/
│               └── cache.module.ts
└── packages/
    └── shared/                   # Shared types between apps
        ├── package.json
        └── src/
            └── types.ts
```

### Key Design Patterns

- **Proxy + Cache pattern** — NestJS acts as a stable API facade over NOAA's variable endpoints. Cache TTLs are set per endpoint based on NOAA's update frequency (wind: 60s, Kp: 60s, flares: 300s, alerts: 120s).
- **Format-agnostic parsing** — NOAA returns both array-of-objects (`/json/` endpoints) and array-of-arrays with header rows (`/products/` endpoints). Parsers auto-detect format using `Array.isArray(data[0])` and normalize to a consistent DTO.
- **Primary + fallback endpoint strategy** — Each data type has a primary and fallback NOAA URL. Fallback fires when primary yields no valid data (not just on network error).
- **`HttpClientModule` with typed client interfaces** — All HTTP transport concerns (base URLs, timeouts, retry logic) are encapsulated in a single `HttpClientModule`. Feature services depend on `INoaaClient` and `INominatimClientService` interfaces, not concrete Axios/undici calls. This isolates transport details, makes unit testing trivial, and enables swapping HTTP clients without touching domain logic. Concrete implementations live in `infrastructure/clients/`.
- **Container / display component split** — Every data-connected React component (e.g., `KpGaugeContainer`) has a corresponding pure display component (`KpGauge`) that accepts only primitive props. Containers own `useSpaceWeather` calls and data mapping; display components are fully tested and visually isolated. No data-fetching logic lives in display components.
- **Custom React hooks** — `useSpaceWeather` encapsulates polling, loading, and error state. `useLocation` manages geocoding and GPS resolution. `useAutoRefresh` drives the 90-second interval with a manual trigger escape hatch.
- **Typed API contract** — Shared types package (`packages/shared`) ensures the NestJS response DTOs and React fetch client use identical TypeScript interfaces, catching contract mismatches at compile time.

---

## 7. Features

### 7.1 Location System
- **City search:** Text input → Nominatim `/search` → lat/lon + display name
- **GPS:** `navigator.geolocation` → reverse geocode via Nominatim `/reverse`
- **Storage:** Location persisted in `localStorage` so returning users skip the modal
- **Switcher:** Header button re-opens modal; switching location triggers immediate data re-fetch and aurora recalculation

### 7.2 Solar Wind Panel
- **Metrics displayed:** Speed (km/s), Density (p/cm³), Bz GSM (nT), Temperature (×10⁴ K)
- **Bz color coding:** Negative (southward) = red/danger, Positive (northward) = green/safe
- **Sparkline chart:** Canvas-rendered, last 80 readings, gradient fill beneath line
- **Data sources:** `plasma-1-day.json` (speed/density/temp) joined with `mag-1-day.json` (Bz) on `time_tag`

### 7.3 Kp Index Gauge
- **Visual:** SVG arc gauge, pivot at bottom-center, sweep from bottom-left to bottom-right through top of viewBox
- **Needle:** Animated, tip tracks along arc, color transitions with Kp value
- **Scale bars:** 9 segmented bars beneath readout, filled by Kp level
- **Labels:** Quiet / Unsettled / Active / G1–G5 storm levels per NOAA scale
- **Color ramp:** Green (<2) → Yellow (2–3) → Orange (4–5) → Red (6+)
- **Fallback:** If primary `planetary_k_index_1m.json` yields no value, automatically tries `noaa-planetary-k-index.json`
- **Accessibility:** SVG element carries `role="meter"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="9"`, `aria-label="Kp Index"`, and an `aria-description` explaining the Kp scale. Severity is also communicated via a visible text label (not color alone) to support color vision deficiency.

### 7.4 Aurora Visibility Calculator
- **Input:** User latitude + current Kp
- **Kp-to-latitude thresholds:** `[66, 64, 62, 60, 58, 55, 50, 45, 40, 35]` for Kp 0–9
- **Status tiers:** Not Visible → Needs Stronger Storm → Borderline → Visible (Conditions Met) → Good Visibility Likely → High Visibility
- **Progress bar:** Width and color reflect visibility tier
- **Displayed fields:** Your latitude, Kp required, current Kp, local time

### 7.5 Flare History
- **Source:** `goes/primary/xray-flares-7-day.json`
- **Display:** Sorted by peak time descending, class + timestamp + duration
- **Color coding:** X=red, M=orange, C=yellow, B=green, A=muted
- **Badge:** Most recent flare class displayed prominently on left panel

### 7.6 Alert Ticker
- **Source:** `products/alerts.json`
- **Behavior:** CSS marquee animation, loops continuously
- **Fallback text:** "NO ACTIVE SPACE WEATHER ALERTS — ALL SYSTEMS NOMINAL"
- **Accessibility:** Ticker container carries `role="log"`, `aria-live="polite"`, and `aria-label="NOAA Space Weather Alerts"`. New alerts are appended to the DOM rather than replaced via animation so screen readers announce them.

### 7.7 Sun Visualization
- **Concentric rings** with staggered pulse animations
- **Solar flare tendrils** on all four compass points, animated with `scaleY` and opacity
- **Radial gradient core** simulating photosphere, chromosphere, corona color layering
- **Ambient glow** behind sun that intensifies with higher Kp (future phase)

---

## 8. Technology Stack

### Frontend (`apps/web`)

| Technology | Version | Purpose |
|---|---|---|
| React | ^19 | UI component framework |
| Vite | ^6 | Build tool and dev server |
| TypeScript | ^5.7 | Type safety |
| shadcn/ui | latest | Base UI component library |
| Tailwind CSS | ^3 | Utility styling (shadcn dependency) |
| Vitest | ^3 | Unit and component testing |
| Zustand | ^5 | Lightweight client state management |
| React Query (TanStack) | ^5 | Server state, caching, auto-refetch |

### Backend (`apps/api`)

| Technology | Version | Purpose |
|---|---|---|
| Node.js | ^22 LTS | Runtime |
| NestJS | ^11 | API framework |
| TypeScript | ^5.7 | Type safety |
| `@nestjs/cache-manager` | ^3 | In-memory response caching |
| `cache-manager` | ^6 | Cache backend |
| `axios` / `undici` | latest | HTTP client for NOAA requests (via `HttpClientModule`) |
| `@nestjs/swagger` | latest | OpenAPI/Swagger spec generation and interactive docs |
| Vitest | ^3 | Unit testing (parser logic, service layer) |

### Shared (`packages/shared`)

| Technology | Purpose |
|---|---|
| TypeScript | Shared type definitions for API DTOs |

### Tooling

| Tool | Purpose |
|---|---|
| pnpm | Package manager + workspace orchestration |
| pnpm workspaces | Monorepo dependency management |
| ESLint | Linting (shared config at root) |
| Prettier | Code formatting |
| Husky + lint-staged | Pre-commit hooks |

### External APIs (No auth required)

| API | Base URL | Usage |
|---|---|---|
| NOAA SWPC | `services.swpc.noaa.gov` | All space weather data |
| Nominatim | `nominatim.openstreetmap.org` | Geocoding + reverse geocoding |

---

## 9. Security & Configuration

### Environment Variables

**Backend (`apps/api/.env`)**
```env
PORT=3001
NOAA_BASE_URL=https://services.swpc.noaa.gov
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
CACHE_TTL_WIND_MS=60000
CACHE_TTL_KP_MS=60000
CACHE_TTL_FLARES_MS=300000
CACHE_TTL_ALERTS_MS=120000
CORS_ORIGIN=http://localhost:5173
```

**Frontend (`apps/web/.env`)**
```env
VITE_API_BASE_URL=http://localhost:3001
```

### Security Considerations

**In Scope (MVP):**
- CORS restricted to known frontend origin via NestJS `CorsModule`
- Nominatim requests include `User-Agent` and `Accept-Language` headers per OSM usage policy
- No secrets stored in frontend code; all external API calls proxied through backend
- Input sanitization on city search query before passing to Nominatim

**Out of Scope (MVP):**
- Authentication / JWT (no user accounts in MVP)
- Rate limiting (low traffic expected; add in production)
- HTTPS / TLS (handled at infrastructure layer in production)
- API key management (all upstream APIs are currently keyless)

### Deployment Considerations
- Backend: containerizable with Docker; stateless except for in-memory cache
- Frontend: static build output (`dist/`) deployable to any CDN (Vercel, Netlify, S3)
- Both services can run locally with a single `pnpm dev` command at monorepo root using `concurrently`

---

## 10. API Specification

### Base URL
`http://localhost:3001` (development)

---

### `GET /space-weather/solar-wind`
Returns merged plasma + magnetometer data.

**Response:**
```json
{
  "data": [
    {
      "time_tag": "2026-04-08T14:30:00Z",
      "speed": 425.3,
      "density": 5.2,
      "temperature": 84200,
      "bz": -3.1
    }
  ],
  "latest": {
    "time_tag": "2026-04-08T14:59:00Z",
    "speed": 431.0,
    "density": 4.8,
    "temperature": 91000,
    "bz": 1.4
  },
  "cachedAt": "2026-04-08T15:00:12Z"
}
```

---

### `GET /space-weather/kp`
Returns current planetary Kp index with source metadata.

**Response:**
```json
{
  "kp": 1.0,
  "label": "QUIET",
  "source": "planetary_k_index_1m",
  "time_tag": "2026-04-08T14:58:00Z",
  "cachedAt": "2026-04-08T15:00:12Z"
}
```

---

### `GET /space-weather/flares`
Returns 7-day solar flare history.

**Response:**
```json
{
  "flares": [
    {
      "class": "C2.3",
      "begin_time": "2026-04-07 11:14:00",
      "peak_time": "2026-04-07 11:22:00",
      "end_time": "2026-04-07 11:31:00",
      "duration_minutes": 17
    }
  ],
  "activeClass": "C2.3",
  "cachedAt": "2026-04-08T15:00:12Z"
}
```

---

### `GET /space-weather/alerts`
Returns active NOAA space weather alert messages.

**Response:**
```json
{
  "alerts": [
    {
      "product_id": "WATA50",
      "issue_time": "2026-04-08T14:30:00Z",
      "message": "Space Weather Message Code: ALTK04..."
    }
  ],
  "cachedAt": "2026-04-08T15:00:12Z"
}
```

---

### `GET /geocode/search?q={query}`
Proxies Nominatim city search.

**Query params:** `q` — city name string

**Response:**
```json
{
  "lat": 35.2271,
  "lon": -80.8431,
  "displayName": "Charlotte, NC, United States"
}
```

---

### `GET /geocode/reverse?lat={lat}&lon={lon}`
Proxies Nominatim reverse geocoding.

**Response:**
```json
{
  "lat": 35.2271,
  "lon": -80.8431,
  "displayName": "Charlotte, Mecklenburg County, NC, US"
}
```

---

## 11. Success Criteria

### MVP Success Definition
A working, deployable application that a software engineering interviewer can open in a browser, enter any world city, and immediately see accurate, live space weather data with no visible errors or broken UI states.

### Functional Requirements

- [ ] Location modal appears on first load; data populates after location is set
- [ ] Solar wind speed, density, Bz, and temperature all display non-null values
- [ ] Bz color encodes southward (red) vs. northward (green) polarity correctly
- [ ] Kp gauge arc and needle render correctly across 0–9 range
- [ ] Kp label maps correctly to NOAA G-scale (Quiet / Unsettled / Active / G1–G5)
- [ ] Flare list sorts by recency; class colors match X/M/C/B/A spectrum
- [ ] Aurora visibility correctly reflects latitude-to-Kp threshold logic
- [ ] Aurora status changes meaningfully when switching between high-latitude and low-latitude cities
- [ ] Alert ticker scrolls continuously; falls back gracefully when no alerts exist
- [ ] Auto-refresh fires every 90s; manual sync button triggers immediate fetch
- [ ] All data reflects NOAA source within one cache TTL window
- [ ] Responsive layout renders correctly at 1440px, 1024px, 768px, and 375px
- [ ] Kp fallback endpoint fires when primary returns no valid value
- [ ] No unhandled promise rejections in browser console

### Quality Indicators
- Parser unit tests pass for both array-of-arrays and array-of-objects NOAA formats
- Aurora threshold logic unit tested against known latitude/Kp combinations
- TypeScript strict mode enabled with zero `any` types in business logic
- All API responses typed via shared DTOs
- Lighthouse performance score ≥ 85 on desktop
- Kp gauge SVG has correct `role="meter"` ARIA attributes; alert ticker has `role="log"` with `aria-live="polite"`
- OpenAPI/Swagger spec accessible at `/api/docs` with all DTOs annotated

### User Experience Goals
- Time to first meaningful paint: < 2 seconds on broadband
- Location submit to full dashboard: < 3 seconds
- No layout shift after data loads
- All empty/loading states are clearly communicated (not blank)

---

## 12. Implementation Phases

### Phase 1 — Monorepo Foundation & Backend Core
**Goal:** Working NestJS API that proxies all NOAA endpoints with caching and typed DTOs.  
**Estimate:** 2–3 days

**Deliverables:**
- [ ] pnpm workspace initialized with `apps/web`, `apps/api`, `packages/shared`
- [ ] NestJS app bootstrapped with TypeScript strict mode
- [ ] `SpaceWeatherModule` with controller + service
- [ ] NOAA plasma, mag, Kp, flares, alerts endpoints implemented
- [ ] Format-agnostic parsers for array-of-arrays and array-of-objects
- [ ] Kp primary + fallback strategy implemented in service
- [ ] In-memory cache with per-endpoint TTLs
- [ ] `GeocodeModule` proxying Nominatim search + reverse
- [ ] Shared types package with `SolarWind`, `KpReading`, `Flare`, `Alert` DTOs
- [ ] Vitest unit tests for all parsers and aurora threshold logic
- [ ] `.env` configuration with validation
- [ ] Swagger implemented

**Validation:** `curl localhost:3001/space-weather/kp` returns valid Kp JSON with `cachedAt` field.

---

### Phase 2 — Frontend Scaffold & Data Integration
**Goal:** React app consuming backend API, all data rendering correctly in unstyled components.  
**Estimate:** 2–3 days

**Deliverables:**
- [ ] Vite + React + TypeScript project initialized
- [ ] shadcn/ui + Tailwind configured
- [ ] React Query set up with auto-refetch interval
- [ ] `useSpaceWeather` hook consuming all four API endpoints
- [ ] `useLocation` hook with geocode + GPS support, localStorage persistence
- [ ] Location modal component functional
- [ ] All data components split into container + display pairs (containers own data fetching; display components accept only primitive props)
- [ ] `SolarWindCard` rendering all four metrics
- [ ] `KpGauge` SVG arc rendering correctly across 0–9 range
- [ ] `FlareList` rendering sorted, color-coded flare history
- [ ] `AuroraCard` computing visibility from latitude + Kp
- [ ] `AlertTicker` scrolling NOAA alert messages
- [ ] Per-card `ErrorBoundary` + `Suspense` wrapping each data panel (failures are isolated — one broken card does not blank the dashboard)
- [ ] Vitest component tests for KpGauge rendering and AuroraCard logic

**Validation:** Dashboard populates with live data for any entered city with no console errors.

---

### Phase 3 — Visual Design & Polish
**Goal:** Full SOLARIS aesthetic applied — dark space theme, animations, Orbitron typography, responsive layouts.  
**Estimate:** 2–3 days

**Deliverables:**
- [ ] CSS custom properties for full color system (cyan, orange, red, green, yellow)
- [ ] Orbitron + Share Tech Mono typography applied
- [ ] Animated starfield canvas background
- [ ] Cyan grid overlay
- [ ] Animated sun visualization with pulsing rings and solar flare tendrils
- [ ] Kp gauge needle animation and color transitions
- [ ] Sparkline wind chart (Canvas API)
- [ ] Flash-on-update animation for cards
- [ ] Responsive breakpoints: 1024px, 768px, 480px
- [ ] Mobile: stacked layout with horizontal sun+badge row at 768px
- [ ] Modal polish (top accent line, loading state, error states)

**Validation:** App matches SOLARIS design spec at all breakpoints; animations run at 60fps.

---

### Phase 4 — Testing, Hardening & Documentation
**Goal:** Production-ready quality — full test coverage on critical paths, error boundaries, README.  
**Estimate:** 1–2 days

**Deliverables:**
- [ ] Vitest tests: NOAA parsers (both formats), Kp extraction, aurora threshold calc
- [ ] Per-card `ErrorBoundary` + `Suspense` on every data panel (not a single page-level boundary)
- [ ] Backend error handling: NOAA request failures return structured error DTOs
- [ ] Frontend graceful degradation: each panel independent (one failure doesn't block others)
- [ ] OpenAPI/Swagger documentation generated and accessible at `/api/docs`
- [ ] `README.md` with setup instructions, architecture overview, API docs link
- [ ] Environment variable documentation
- [ ] `pnpm dev` starts both api and web concurrently
- [ ] Production build verified (`pnpm build` succeeds for both apps)

**Validation:** `pnpm test` passes all suites; app loads and functions correctly after `pnpm build`.

---

## 13. Future Considerations

### Post-MVP Enhancements

**Aurora Forecast Map**
Integrate NOAA's OVATION model (`ovation_aurora_latest.json`) to render an animated aurora oval overlay on a world map using D3 + TopoJSON. This is the most-requested feature from aurora chasers.

**Real-time WebSocket Streaming**
Replace polling with a WebSocket connection from NestJS that pushes delta updates only when NOAA data changes, reducing unnecessary re-renders and giving a true real-time feel.

**Storm Alert Notifications**
Allow users to set a Kp threshold and receive browser push notifications or email alerts when the threshold is crossed. Requires a user account system and a notification service (e.g., Web Push API + service worker).

**Historical Data Explorer**
30-day and solar-cycle-length Kp and solar wind charts using NOAA's historical archives. Useful for researchers and enthusiasts studying solar cycle patterns.

**CME Tracker**
Surface coronal mass ejection data from NOAA's DONKI API, showing estimated Earth impact time and expected Kp enhancement for upcoming CMEs.

**Dark Sky Integration**
Overlay light pollution data on the aurora map to help users find optimal viewing locations near their city.

**PWA / Offline Support**
Service worker caching of last-known data so the app remains useful when connectivity is poor (e.g., in a remote dark sky location).

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **NOAA endpoint format changes** — NOAA has changed field names and response formats historically without notice | Medium | High | Format-agnostic parsers using key detection (`/^kp/i` regex, `Array.isArray` check). Backend isolates parsing from the controller so format fixes are local. |
| **NOAA endpoint downtime** — SWPC has scheduled maintenance windows and occasional outages | Medium | Medium | Primary + fallback endpoint strategy for Kp. Cache keeps last-known data available during brief outages. All panels fail independently. |
| **Nominatim rate limiting** — OSM's free geocoder enforces 1 req/sec per IP | Low | Low | Geocode only on user action (not on every render). Backend proxy adds `User-Agent` per OSM policy. Responses cached by query string. |
| **Canvas wind chart sizing** — Canvas must be explicitly sized; CSS-only resizing causes blurry or mis-sized rendering | Medium | Low | Chart redraws on `window.resize` using `offsetWidth` at draw time. Width always read from DOM, never hardcoded. |
| **Interview environment CORS** — Opened directly as `file://` may block fetch to `localhost:3001` | Low | High | Document clearly in README that the app must be served (not opened as a file). Provide `pnpm dev` as the standard entry point. |

---

## 15. Appendix

### Key External Dependencies

| Resource | URL |
|---|---|
| NOAA SWPC Data Service Index | https://services.swpc.noaa.gov/json/ |
| NOAA SWPC Products Index | https://services.swpc.noaa.gov/products/ |
| NOAA Planetary K-index docs | https://www.swpc.noaa.gov/products/planetary-k-index |
| NOAA Solar Wind docs | https://www.swpc.noaa.gov/products/real-time-solar-wind |
| Nominatim Search API | https://nominatim.org/release-docs/latest/api/Search/ |
| NestJS Documentation | https://docs.nestjs.com |
| shadcn/ui | https://ui.shadcn.com |
| Vitest | https://vitest.dev |

### NOAA Endpoints Reference

| Endpoint | Format | Update Freq | TTL |
|---|---|---|---|
| `/json/planetary_k_index_1m.json` | Array of objects | 1 min | 60s |
| `/products/noaa-planetary-k-index.json` | Array of arrays | 3 hr | 60s |
| `/products/solar-wind/plasma-1-day.json` | Array of arrays | 1 min | 60s |
| `/products/solar-wind/mag-1-day.json` | Array of arrays | 1 min | 60s |
| `/json/goes/primary/xray-flares-7-day.json` | Array of objects | 5 min | 300s |
| `/products/alerts.json` | Array of objects | Variable | 120s |

### Aurora Kp-to-Latitude Threshold Table

| Kp | Minimum Latitude for Visibility |
|---|---|
| 0 | 66° |
| 1 | 64° |
| 2 | 62° |
| 3 | 60° |
| 4 | 58° |
| 5 | 55° |
| 6 | 50° |
| 7 | 45° |
| 8 | 40° |
| 9 | 35° |

*Source: Standard geomagnetic latitude tables used by aurora forecasting services.*

---

## 16. Expert Review Feedback

> These items were surfaced during a senior engineer review. They are candidates for Phase 2 hardening or post-MVP work. Items 1, 4, 5, 6, and 9 from the original list have been promoted into the main PRD above.

---

### Backend (NestJS)

#### Caching
- **Namespace all cache keys** — Use a `CacheKeyBuilder` utility: `space-weather:kp:v1`, `geocode:search:<normalized-query>`. Raw keys like `"kp"` collide in shared stores. Geocode queries must be normalized (lowercased, trimmed) before use as a key.
- **Stale-while-revalidate for Kp fallback** — When both primary and fallback NOAA endpoints fail, serve the last expired cached value and fire a background refresh instead of returning an error. Store a `stale:` prefixed version alongside the live version.
- **Cache empty NOAA responses** — Cache no-alert/no-flare responses with a short 15s TTL to avoid live NOAA round-trips during quiet periods.
- **`GET /admin/cache/invalidate` endpoint** — Even a simple static-token-protected endpoint enables cache-busting during demos or incidents without restarting the process.

#### Resilience
- **Circuit breaker with `opossum`** — Wrap each `NoaaClientService` method. Open circuit after 5 failures in 30s, serve stale cache, close after a successful probe.
- **Zod validation on NOAA responses** — Parse raw NOAA responses through a Zod schema before the domain layer. Log the raw response (truncated) and throw a typed `NoaaResponseMalformedException` on schema failure.
- **Retry with exponential backoff + jitter** — `axios-retry`: max 3 attempts, 200ms base, ±50ms jitter, only on network errors and 5xx (never 4xx). Lives in `HttpClientModule`.
- **`TimeoutInterceptor`** — 5-second hard timeout on all incoming requests (configurable per route via decorator) to prevent slow NOAA responses from holding open connections.

#### API Design
- **Version from day one** — `setGlobalPrefix('api/v1')`. Changing this later is a breaking change.
- **`@nestjs/terminus` health checks** — `/health/live` (process alive) + `/health/ready` (NOAA + cache reachable). Kubernetes/Docker expects this.
- **`GET /space-weather/summary` aggregate endpoint** — Returns solar wind + Kp + alerts in one call, eliminating three parallel fetches from the frontend.
- **`Cache-Control` response headers** — `public, max-age=<TTL>` on weather routes, `private` on geocode routes, via a `CacheHeaderInterceptor`.
- **`X-Data-Age-Seconds` response header** — Emit how old the cached data is so the frontend can display "Updated 43s ago" without an extra API call.

#### Architecture / Observability
- **`ResponseTransformInterceptor`** — Standardize every response to `{ data: T, meta: { timestamp, requestId, version } }` at the app level.
- **`RequestIdMiddleware` with `AsyncLocalStorage`** — Generate a UUID per request, propagate through all log lines and outbound NOAA calls.
- **Strategy pattern for NOAA parsers** — Replace the `Array.isArray(data[0])` branch with a `NoaaParserStrategy` interface and concrete implementations (`ArrayOfArraysParser`, `ArrayOfObjectsParser`) registered in a map.
- **`nestjs-pino` structured logging** — Replaces the default logger with NDJSON output; configure `redactPaths` for coordinates in geocode queries.
- **Custom `@CacheTTL` decorator reading from `ConfigService`** — No hardcoded TTL numbers in decorators; values driven by environment config.

#### Security
- **`@nestjs/throttler` on the geocode endpoint** — Nominatim enforces 1 req/sec per IP. A `ThrottlerGuard` demonstrates policy awareness and prevents accidental banning.
- **`helmet` + strict CORS** — Not `*`. Frontend origin only, configured explicitly.
- **Sanitize geocode query** — A `ParseStringPipe` strips non-printable characters and enforces a 256-char max before the query reaches Nominatim.

#### Testing
- **Contract tests for NOAA response fixtures** — Save real NOAA response fixtures to `test/fixtures/noaa/`. Run Zod parsers against them. Most likely source of production bugs.
- **Integration tests for the cache layer** — Assert that a second call within TTL returns the cached value without hitting the HTTP client, using a real in-memory `cache-manager` store.
- **Test fallback/circuit-breaker paths** — Explicitly test: primary fails → fallback fires; both fail → stale cache served.
- **`supertest` end-to-end suite** — At least one E2E test per route (mocked NOAA upstream via `nock`) demonstrates full request lifecycle awareness.

---

### Frontend (React)

#### React 19 Features
- **`useFormStatus` + `useActionState` for the location modal** — Models the form lifecycle (idle/pending/success/error) as a state machine instead of multiple `useState` calls.
- **`useOptimistic` for location switching** — Immediately reflect the new city in the aurora card before the refetch completes.
- **`startTransition` for gauge/sparkline updates** — Marks needle animations and canvas redraws as non-urgent; keeps the ticker and interactive elements responsive during data refreshes.
- **`useDeferredValue` for the city search input** — Keeps the input field responsive while the Nominatim results list updates at lower priority.
- **`React.lazy` + `Suspense` for the location modal** — Only needed when opened; trivial bundle split, production-readiness habit.

#### State Management
- **Hard boundary: React Query owns server state, Zustand owns UI state** — Never store fetched data in Zustand. Zustand holds: selected location, unit preferences, dismissed alert IDs, panel collapse state.
- **Derive, don't store** — Aurora visibility level, Kp severity label, flare classification are derived from React Query data via selector functions or `useMemo`. Storing derived state causes sync bugs when source data updates.
- **Query key factory in `queryKeys.ts`** — `spaceWeather.all()`, `spaceWeather.kp()`, `spaceWeather.solar()`. Prevents key collisions, enables targeted invalidation.
- **Explicit `staleTime` just under 90s** — Set intentionally so data is considered fresh during a render but triggers a background refetch at the right cadence. Most candidates miss this nuance.
- **Zustand slice pattern** — Structure as named slices (`locationSlice`, `uiSlice`, `preferencesSlice`) from day one. Persist only the location and preferences slices via `zustand/middleware`.

#### Performance
- **`rAF` loop for starfield, not `useEffect` on data change** — Start once on mount, cancel on unmount. Never re-trigger on data updates.
- **`OffscreenCanvas` for sparkline computation** — Forward-looking; demonstrates awareness of main thread budget.
- **Virtualize the flare list with TanStack Virtual** — Flare history grows unbounded with repeated refetches across a long session.
- **`React.memo` with custom comparators on display components** — Kp gauge: only re-render if value crosses a severity threshold. Aurora card: only re-render if visibility band changes.
- **Debounce Nominatim search at 300ms** — Prevents spamming the geocode proxy on every keystroke.

#### Accessibility
- **Focus management in the location modal** — On open: focus the search input. On close: return focus to the trigger button. Table-stakes for keyboard users.
- **`useReducedMotion` hook** — Respect `prefers-reduced-motion` for sun rings, needle transitions, and starfield. One `matchMedia` call disables all animation.
- **Color is not the only indicator** — Kp severity and Bz polarity use color coding. Add a secondary text label or shape change at each severity threshold for color vision deficiency support.
- **Keyboard navigation** — Collapsible card toggles must be `<button>` elements with visible focus rings and `aria-expanded` state. Never `<div onClick>`.

#### Testing
- **MSW for all API mocking** — Intercepts at the network level; tests are immune to internal refactors of the fetch layer.
- **`renderHook` tests for custom hooks** — `useSpaceWeather`, `useLocation`, `useAutoRefresh` each have dedicated tests covering idle → loading → success → stale → refetching state transitions. Use `vi.useFakeTimers` for the 90s interval.
- **Visual regression for Canvas components** — Snapshot `toDataURL()` output for the sparkline and gauge. Catches unintended visual regressions without a full visual testing service.
- **Test error boundary recovery** — Explicitly assert that forcing a React Query error state renders the per-card fallback UI, not a white screen.
- **`vitest-axe` accessibility smoke test** — Run `axe()` on the rendered dashboard to catch contrast violations, missing ARIA roles, and unlabeled interactive elements automatically.

#### UX
- **"Updated Xs ago" timestamp counter** — `useRelativeTime(lastUpdatedAt)` with `setInterval`, resets on each successful refetch. Makes the 90s polling cycle visible.
- **Connection-aware polling** — Pause refetch when `navigator.onLine === false` or `visibilitychange` fires. React Query's `refetchOnWindowFocus` + `networkMode: 'offlineFirst'` handle this natively.
- **Offline fallback with stale data** — `placeholderData` + `status === 'error'` with data still populated. Show a banner; do not blank the dashboard.
- **Flare severity filter** — Client-side filter over React Query cached data (All / X / M / C). No new API calls needed.
- **Aurora visibility explainer tooltip** — An `<InfoIcon>` opening a Radix UI tooltip explaining the Kp-to-visibility mapping for the user's latitude.
- **Kp threshold push notification opt-in** — When Kp ≥ 5, prompt for browser Notification API permission. Natural feature for the domain, a few hours of work.

#### Interview-Specific Signals
- **Architecture Decision Records in `docs/decisions/`** — 2–3 short ADRs documenting: why Zustand over Context, why per-card error boundaries, why MSW over module mocks. Senior interviewers care about reasoning.
- **`web-vitals` instrumentation** — Log CLS, LCP, FID in development. The Canvas starfield and frequent React Query refetches are real LCP/CLS risks.
- **Discriminated union types for severity** — `type KpSeverity = 'quiet' | 'unsettled' | 'active' | 'minor-storm' | 'major-storm'`. Propagates through the codebase, eliminates a class of runtime bugs.
- **`use()` hook with Suspense boundaries** — Replace manual `isLoading` flag handling in components with React 19's `use()` + Suspense; the boundary becomes the natural loading state.