import { useSpaceWeather } from '@/hooks/useSpaceWeather';
import { SolarWindCardDisplay } from './SolarWindCardDisplay';

export function SolarWindCardContainer() {
  const { solarWind, isLoading, isError } = useSpaceWeather();

  const latest = solarWind?.latest;

  return (
    <SolarWindCardDisplay
      speed={latest?.speed ?? null}
      density={latest?.density ?? null}
      temperature={latest?.temperature ?? null}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
