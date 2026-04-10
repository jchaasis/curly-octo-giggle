import { useQueries } from '@tanstack/react-query';
import { fetchSolarWind, fetchKp, fetchFlares, fetchAlerts } from '@/services/api';
import type { SolarWindResponse, KpResponse, FlaresResponse, AlertsResponse } from '@repo/shared';

export interface SpaceWeatherData {
  solarWind: SolarWindResponse | undefined;
  kp: KpResponse | undefined;
  flares: FlaresResponse | undefined;
  alerts: AlertsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  dataUpdatedAt: number;
  refetch: () => void;
}

export function useSpaceWeather(): SpaceWeatherData {
  const results = useQueries({
    queries: [
      { queryKey: ['space-weather', 'solar-wind'], queryFn: fetchSolarWind },
      { queryKey: ['space-weather', 'kp'], queryFn: fetchKp },
      { queryKey: ['space-weather', 'flares'], queryFn: fetchFlares },
      { queryKey: ['space-weather', 'alerts'], queryFn: fetchAlerts },
    ],
  });

  const [solarWindQ, kpQ, flaresQ, alertsQ] = results;

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  function refetch() {
    results.forEach((r) => void r.refetch());
  }

  return {
    solarWind: solarWindQ.data,
    kp: kpQ.data,
    flares: flaresQ.data,
    alerts: alertsQ.data,
    isLoading,
    isError,
    // Kp drives the refresh indicator — it's the primary signal for current conditions.
    dataUpdatedAt: kpQ.dataUpdatedAt,
    refetch,
  };
}
