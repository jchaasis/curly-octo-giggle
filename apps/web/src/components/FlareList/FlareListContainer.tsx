import type { Flare } from '@repo/shared';
import { useSpaceWeather } from '@/hooks/useSpaceWeather';
import { FlareList } from './FlareList';

function sortFlares(flares: Flare[]): Flare[] {
  return [...flares].sort((a, b) => {
    const aTime = a.peak_time ?? a.begin_time;
    const bTime = b.peak_time ?? b.begin_time;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export function FlareListContainer() {
  const { flares, isLoading, isError } = useSpaceWeather();

  const sorted = flares ? sortFlares(flares.flares) : [];

  return (
    <FlareList
      flares={sorted}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
