import type { Flare } from '@repo/shared';

interface FlareListProps {
  flares: Flare[];
  isLoading: boolean;
  isError: boolean;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
}

function flareColor(scale: string): string {
  const letter = scale.charAt(0).toUpperCase();
  if (letter === 'X') return 'var(--s-red)';
  if (letter === 'M') return 'var(--s-orange)';
  if (letter === 'C') return 'var(--s-yellow)';
  return 'var(--s-tx2)';
}

export function FlareList({ flares, isLoading, isError }: FlareListProps) {
  return (
    <div className="solaris-card" style={{ flex: 1 }}>
      <div className="solaris-card-title">// SOLAR FLARES — 7-DAY HISTORY</div>

      {isError && !isLoading ? (
        <p style={{ fontSize: 11, color: 'var(--s-red)', letterSpacing: 1 }}>FAILED TO LOAD FLARE DATA</p>
      ) : isLoading ? (
        <p style={{ fontSize: 11, color: 'var(--s-tx2)', letterSpacing: 1 }}>LOADING FLARE DATA...</p>
      ) : flares.length === 0 ? (
        <p style={{ fontSize: 11, color: 'var(--s-tx2)', letterSpacing: 1, padding: '8px 0' }}>NO FLARES IN THE PAST 7 DAYS.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {flares.map((flare, idx) => (
            <div
              key={`${flare.begin_time}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 0',
                borderBottom: idx < flares.length - 1 ? '1px solid var(--s-border)' : 'none',
                fontSize: 11,
              }}
            >
              <span style={{
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                minWidth: 34,
                color: flareColor(flare.scale),
              }}>
                {flare.scale}
              </span>
              <span style={{ color: 'var(--s-tx2)', fontSize: 10, flex: 1 }}>
                {formatTime(flare.begin_time)}
              </span>
              <span style={{ color: 'var(--s-tx3)', fontSize: 10 }}>
                {flare.peak_time ? formatTime(flare.peak_time) : 'IN PROGRESS'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
