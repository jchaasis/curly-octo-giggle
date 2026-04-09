import type { Alert } from '@repo/shared';
import { useSpaceWeather } from '@/hooks/useSpaceWeather';
import { AlertTicker } from './AlertTicker';

const NOMINAL_ALERT: Alert = {
  issue_time: new Date().toISOString(),
  product_id: 'NOMINAL',
  message: 'NO ACTIVE SPACE WEATHER ALERTS — ALL SYSTEMS NOMINAL',
};

export function AlertTickerContainer() {
  const { alerts, isLoading, isError } = useSpaceWeather();

  const hasAlerts = alerts?.alerts && alerts.alerts.length > 0;
  const displayAlerts: Alert[] =
    !isLoading && !isError && !hasAlerts ? [NOMINAL_ALERT] : (alerts?.alerts ?? []);

  return (
    <AlertTicker
      alerts={displayAlerts}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
