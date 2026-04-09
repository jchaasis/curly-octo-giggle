import type {
  SolarWindResponse,
  KpResponse,
  FlaresResponse,
  AlertsResponse,
} from '@repo/shared';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export function fetchSolarWind(): Promise<SolarWindResponse> {
  return apiFetch<SolarWindResponse>('/api/space-weather/solar-wind');
}

export function fetchKp(): Promise<KpResponse> {
  return apiFetch<KpResponse>('/api/space-weather/kp');
}

export function fetchFlares(): Promise<FlaresResponse> {
  return apiFetch<FlaresResponse>('/api/space-weather/flares');
}

export function fetchAlerts(): Promise<AlertsResponse> {
  return apiFetch<AlertsResponse>('/api/space-weather/alerts');
}
