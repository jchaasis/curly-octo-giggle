export interface SolarWind {
  time_tag: string;
  speed: number | null;
  density: number | null;
  temperature: number | null;
}

export interface MagReading {
  time_tag: string;
  bz: number | null;
}

export interface KpReading {
  time_tag: string;
  kp: number;
  source: 'primary' | 'fallback';
}

export interface Flare {
  begin_time: string;
  peak_time: string | null;
  end_time: string | null;
  class_letter: string;
  scale: string;
  linked_events: string[] | null;
}

export interface Alert {
  issue_time: string;
  product_id: string;
  message: string;
}

export interface GeoLocation {
  city: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

// ---------------------------------------------------------------------------
// API response envelopes — returned by the NestJS backend and consumed by the
// React frontend. Kept here so both sides share the same shape without
// importing from each other.
// ---------------------------------------------------------------------------

export interface SolarWindResponse {
  data: SolarWind[];
  latest: SolarWind | null;
}

export interface KpResponse {
  kp: number;
  label: string;
  source: 'primary' | 'fallback';
  time_tag: string;
}

export interface FlaresResponse {
  flares: Flare[];
  activeClass: string | null;
}

export interface AlertsResponse {
  alerts: Alert[];
}

/** Shape returned by GET /api/geocode/search and GET /api/geocode/reverse */
export interface GeoResult {
  city: string;
  lat: number;
  lon: number;
  displayName: string;
}
