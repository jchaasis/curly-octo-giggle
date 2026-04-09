import { useCallback } from 'react';
import { useLocationStore } from '@/stores/locationStore';
import { searchCity, reverseGeocode } from '@/services/geocode';
import type { GeoResult } from '@repo/shared';

const STORAGE_KEY = 'solaris:location';

export interface UseLocationResult {
  lat: number | null;
  lon: number | null;
  displayName: string | null;
  setByCity: (q: string) => Promise<GeoResult[]>;
  setByGPS: () => Promise<void>;
  clearLocation: () => void;
}

function persist(result: GeoResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // localStorage may be unavailable in some browser contexts
  }
}

export function readPersistedLocation(): GeoResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GeoResult;
  } catch {
    return null;
  }
}

export function useLocation(): UseLocationResult {
  const { lat, lon, displayName, setLocation, clearLocation } = useLocationStore();

  const setByCity = useCallback(async (q: string): Promise<GeoResult[]> => {
    const results = await searchCity(q);
    if (results.length > 0) {
      const first = results[0];
      setLocation({ lat: first.lat, lon: first.lon, displayName: first.displayName });
      persist(first);
    }
    return results;
  }, [setLocation]);

  const setByGPS = useCallback(async (): Promise<void> => {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10_000,
        maximumAge: 60_000,
      });
    });

    const { latitude, longitude } = position.coords;
    const result = await reverseGeocode(latitude, longitude);
    setLocation({ lat: result.lat, lon: result.lon, displayName: result.displayName });
    persist(result);
  }, [setLocation]);

  const clear = useCallback(() => {
    clearLocation();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [clearLocation]);

  return { lat, lon, displayName, setByCity, setByGPS, clearLocation: clear };
}
