import { useState, useEffect, useCallback } from 'react';
import { useSpaceWeather, type SpaceWeatherData } from './useSpaceWeather';

export interface UseAutoRefreshResult extends SpaceWeatherData {
  lastSyncedAt: Date | null;
  triggerSync: () => void;
}

export function useAutoRefresh(): UseAutoRefreshResult {
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const spaceWeather = useSpaceWeather();

  // Update lastSyncedAt whenever the kp cachedAt timestamp changes — this is
  // our signal that all queries have completed a successful fetch cycle.
  const cachedAt = spaceWeather.kp?.cachedAt;
  useEffect(() => {
    if (cachedAt) setLastSyncedAt(new Date(cachedAt));
  }, [cachedAt]);

  const triggerSync = useCallback(() => {
    spaceWeather.refetch();
  }, [spaceWeather]);

  return { ...spaceWeather, lastSyncedAt, triggerSync };
}
