import { getAuroraStatus } from '@/lib/aurora';

interface AuroraCardProps {
  kp: number | undefined;
  latitude: number | null;
  isLoading: boolean;
  isError: boolean;
}

function tierColor(tier: number): string {
  if (tier >= 5) return 'var(--s-green)';
  if (tier >= 4) return '#66ff99';
  if (tier >= 3) return 'var(--s-cyan)';
  if (tier >= 2) return 'var(--s-yellow)';
  if (tier >= 1) return 'var(--s-orange)';
  return 'var(--s-tx2)';
}

export function AuroraCard({ kp, latitude, isLoading, isError }: AuroraCardProps) {
  const hasData = kp !== undefined && latitude !== null;
  const status = hasData ? getAuroraStatus(kp, latitude) : null;

  return (
    <div
      style={{
        border: '1px solid var(--s-border)',
        padding: '14px 20px',
        background: 'var(--s-cyan-06)',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Left cyan accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 2, height: '100%',
        background: 'var(--s-cyan)',
        opacity: 0.6,
      }} />

      <div style={{ fontSize: 9, color: 'var(--s-cyan)', letterSpacing: '3px', marginBottom: 10, textTransform: 'uppercase' }}>
        // AURORA VISIBILITY — YOUR LOCATION
      </div>

      {isError && !isLoading ? (
        <p style={{ fontSize: 11, color: 'var(--s-red)', letterSpacing: 1 }}>FAILED TO LOAD AURORA DATA</p>
      ) : isLoading ? (
        <p style={{ fontSize: 11, color: 'var(--s-tx2)', letterSpacing: 1 }}>LOADING...</p>
      ) : !hasData ? (
        <p style={{ fontSize: 11, color: 'var(--s-tx2)', letterSpacing: 1 }}>
          {latitude === null ? 'SET LOCATION TO SEE VISIBILITY.' : 'AWAITING KP DATA...'}
        </p>
      ) : status !== null ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: 'var(--s-tx2)', letterSpacing: '2px', marginBottom: 3 }}>YOUR LATITUDE</div>
              <div style={{ fontSize: 15, fontFamily: 'Orbitron, sans-serif', fontWeight: 700, color: 'var(--s-cyan)' }}>
                {latitude.toFixed(1)}°
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: 'var(--s-tx2)', letterSpacing: '2px', marginBottom: 3 }}>CURRENT KP</div>
              <div style={{ fontSize: 15, fontFamily: 'Orbitron, sans-serif', fontWeight: 700, color: 'var(--s-green)' }}>
                {kp.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 12, height: 4, background: 'var(--s-tx3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${status.progress * 100}%`,
              background: tierColor(status.tier),
              borderRadius: 2,
              transition: 'width 1s ease',
            }} />
          </div>

          <div style={{
            fontSize: 9,
            letterSpacing: '2px',
            marginTop: 6,
            fontWeight: 700,
            color: tierColor(status.tier),
            textTransform: 'uppercase',
          }}>
            {status.label}
          </div>
        </>
      ) : null}
    </div>
  );
}
