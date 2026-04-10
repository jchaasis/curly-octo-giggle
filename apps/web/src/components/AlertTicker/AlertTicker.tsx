import type { Alert } from '@repo/shared';

interface AlertTickerProps {
  alerts: Alert[];
  isLoading: boolean;
  isError: boolean;
}

function buildTickerText(alerts: Alert[]): string {
  if (alerts.length === 0) return 'NO ACTIVE SPACE WEATHER ALERTS — MONITORING NOMINAL — DATA SOURCE: NOAA SWPC';
  return alerts
    .map((a) => `${a.product_id}: ${a.message.replace(/\n/g, ' ')}`)
    .join('   ◈   ');
}

export function AlertTicker({ alerts, isLoading, isError }: AlertTickerProps) {
  const text = isLoading
    ? 'INITIALIZING SPACE WEATHER MONITORING SYSTEM — DATA SOURCE: NOAA SWPC'
    : isError
    ? 'ALERT FEED UNAVAILABLE — CHECK CONNECTION'
    : buildTickerText(alerts);

  return (
    <div
      role="log"
      aria-live="polite"
      style={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(2,4,9,0.92)',
        borderTop: '1px solid var(--s-border)',
        display: 'flex',
        alignItems: 'center',
        height: 32,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Label */}
      <div style={{
        fontSize: 9,
        letterSpacing: '3px',
        color: 'var(--s-cyan)',
        padding: '0 14px',
        borderRight: '1px solid var(--s-border)',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        background: 'rgba(0,245,255,0.04)',
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
      }}>
        NOAA ALERTS
      </div>

      {/* Scrolling text — duration scales with text length so speed stays constant */}
      <div style={{ overflow: 'hidden', flex: 1, height: '100%', display: 'flex', alignItems: 'center', position: 'relative' }}>
        <div style={{
          whiteSpace: 'nowrap',
          fontSize: 10,
          color: 'var(--s-tx2)',
          letterSpacing: '1px',
          animation: `ticker-scroll ${Math.max(30, text.length * 0.12)}s linear infinite`,
        }}>
          {text}
        </div>
      </div>
    </div>
  );
}
