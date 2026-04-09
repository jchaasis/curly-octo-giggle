// Arc sweeps 270° from 225° (bottom-left) to 315° (bottom-right) through the top.
// 0° = 3 o'clock. Angles increase clockwise in SVG space.
const START_ANGLE_DEG = 225;
const SWEEP_DEG = 270;
const CX = 100;
const CY = 110;
const RADIUS = 75;

interface KpGaugeProps {
  kp: number;
  label: string;
  isLoading: boolean;
  isError: boolean;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, start: number, end: number): string {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

function kpColor(kp: number): string {
  if (kp >= 6) return 'var(--s-red)';
  if (kp >= 4) return 'var(--s-orange)';
  if (kp >= 2) return 'var(--s-yellow)';
  return 'var(--s-green)';
}

export function KpGauge({ kp, label, isLoading, isError }: KpGaugeProps) {
  const clampedKp = Math.min(9, Math.max(0, kp));
  const fraction = clampedKp / 9;
  const needleAngle = START_ANGLE_DEG + fraction * SWEEP_DEG;
  const needleTip = polarToCartesian(CX, CY, RADIUS - 10, needleAngle);
  const trackPath = describeArc(CX, CY, RADIUS, START_ANGLE_DEG, START_ANGLE_DEG + SWEEP_DEG);
  const activePath =
    fraction > 0
      ? describeArc(CX, CY, RADIUS, START_ANGLE_DEG, START_ANGLE_DEG + fraction * SWEEP_DEG)
      : null;
  const color = kpColor(clampedKp);

  return (
    <div className="solaris-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="solaris-card-title">// GEOMAGNETIC ACTIVITY — PLANETARY KP INDEX</div>

      {isError && !isLoading ? (
        <p style={{ fontSize: 11, color: 'var(--s-red)', letterSpacing: 1 }}>
          FAILED TO LOAD KP DATA
        </p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* SVG gauge */}
          <svg
            viewBox="0 0 200 170"
            width="200"
            height="170"
            style={{ flexShrink: 0 }}
            role="meter"
            aria-valuenow={kp}
            aria-valuemin={0}
            aria-valuemax={9}
            aria-label="Planetary K-index"
          >
            {/* Track arc */}
            <path
              d={trackPath}
              fill="none"
              stroke="rgba(0,245,255,0.1)"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Active arc */}
            {activePath && !isLoading && (
              <path
                d={activePath}
                fill="none"
                stroke={color}
                strokeWidth="9"
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 6px ${color})`,
                  transition: 'stroke 0.8s ease-in-out',
                }}
              />
            )}
            {/* Needle */}
            {!isLoading && (
              <line
                x1={CX}
                y1={CY}
                x2={needleTip.x}
                y2={needleTip.y}
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ transition: 'all 0.8s ease-in-out' }}
              />
            )}
            {/* Hub */}
            <circle cx={CX} cy={CY} r={4} fill="white" opacity={0.9} />
            {/* Scale labels */}
            <text x={6} y={CY + 55} fill="rgba(0,245,255,0.35)" fontSize="9" fontFamily="Share Tech Mono">0</text>
            <text x={190} y={CY + 55} fill="rgba(0,245,255,0.35)" fontSize="9" fontFamily="Share Tech Mono" textAnchor="end">9</text>
          </svg>

          {/* KP info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 46,
              fontWeight: 900,
              lineHeight: 1,
              color: isLoading ? 'var(--s-tx3)' : color,
              transition: 'color 0.5s',
            }}>
              {isLoading ? '--' : clampedKp.toFixed(1)}
            </div>
            <div style={{ fontSize: 10, letterSpacing: '2px', color: 'var(--s-tx2)', marginTop: 5 }}>
              {isLoading ? 'LOADING...' : label}
            </div>
            {/* 9 segment bars */}
            <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
              {Array.from({ length: 9 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    height: 5,
                    flex: 1,
                    borderRadius: 1,
                    background: !isLoading && i < Math.ceil(clampedKp) ? color : 'var(--s-tx3)',
                    transition: 'background 0.6s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
