import { useSpaceWeather } from '@/hooks/useSpaceWeather';
import { SunPanel } from './SunPanel';

export function SunPanelContainer() {
  const { flares } = useSpaceWeather();

  return <SunPanel activeClass={flares?.activeClass ?? null} />;
}
