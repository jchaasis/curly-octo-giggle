import { useSpaceWeather } from '@/hooks/useSpaceWeather';
import { SolarWindCardDisplay } from './SolarWindCardDisplay';

export function SolarWindCardContainer() {
  const { solarWind, isLoading, isError } = useSpaceWeather();

  const latest = solarWind?.latest;
  const speedHistory = solarWind?.data
    .map((r) => r.speed)
    .filter((s): s is number => s !== null)
    .slice(-80) ?? [];

  return (
    <SolarWindCardDisplay
      speed={latest?.speed ?? null}
      density={latest?.density ?? null}
      temperature={latest?.temperature ?? null}
      {/* TODO: Bz (GSM) requires a dedicated magnetic field endpoint — not included in SolarWindResponse */}
      bz={null}
      speedHistory={speedHistory}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
