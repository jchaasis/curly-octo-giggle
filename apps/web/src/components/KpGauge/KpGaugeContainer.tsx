import { useSpaceWeather } from '@/hooks/useSpaceWeather';
import { KpGauge } from './KpGauge';

export function KpGaugeContainer() {
  const { kp, isLoading, isError } = useSpaceWeather();

  return (
    <KpGauge
      kp={kp?.kp ?? 0}
      label={kp?.label ?? ''}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
