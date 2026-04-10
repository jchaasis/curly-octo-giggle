import { useState, useEffect, useCallback } from 'react';
import { useSpaceWeather, type SpaceWeatherData } from './useSpaceWeather';

export interface UseAutoRefreshResult extends SpaceWeatherData {
  lastSyncedAt: Date | null;
  triggerSync: () => void;
}

export function useAutoRefresh(): UseAutoRefreshResult {
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const spaceWeather = useSpaceWeather();

  // Update lastSyncedAt whenever React Query's dataUpdatedAt changes — this is
  // our signal that all queries have completed a successful fetch cycle.
  const { dataUpdatedAt } = spaceWeather;
  useEffect(() => {
    if (dataUpdatedAt) setLastSyncedAt(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  const triggerSync = useCallback(() => {
    spaceWeather.refetch();
  }, [spaceWeather]);

  return { ...spaceWeather, lastSyncedAt, triggerSync };
}
