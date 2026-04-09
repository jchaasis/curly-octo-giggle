import type { GeoResult } from '@repo/shared';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export function searchCity(q: string): Promise<GeoResult[]> {
  const params = new URLSearchParams({ q });
  return apiFetch<GeoResult[]>(`/api/geocode/search?${params.toString()}`);
}

export function reverseGeocode(lat: number, lon: number): Promise<GeoResult> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  return apiFetch<GeoResult>(`/api/geocode/reverse?${params.toString()}`);
}
