import { useSpaceWeather } from '@/hooks/useSpaceWeather';
import { useLocationStore } from '@/stores/locationStore';
import { AuroraCard } from './AuroraCard';

export function AuroraCardContainer() {
  const { kp, isLoading, isError } = useSpaceWeather();
  const lat = useLocationStore((s) => s.lat);

  return (
    <AuroraCard
      kp={kp?.kp}
      latitude={lat}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
