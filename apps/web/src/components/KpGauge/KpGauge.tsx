import { cn } from '@/lib/utils';

interface KpGaugeProps {
  kp: number;
  label: string;
  isLoading: boolean;
  isError: boolean;
}

// Arc sweeps 270° from 225° (bottom-left) to 315° (bottom-right) through the top.
// 0° = 3 o'clock. We work in SVG degrees where angles increase clockwise.
const START_ANGLE_DEG = 225;
const SWEEP_DEG = 270;
const CX = 80;
const CY = 80;
const RADIUS = 60;

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function kpColor(kp: number): string {
  if (kp >= 7) return '#ef4444'; // red
  if (kp >= 5) return '#eab308'; // yellow
  return '#22c55e'; // green
}

export function KpGauge({ kp, label, isLoading, isError }: KpGaugeProps) {
  const clampedKp = Math.min(9, Math.max(0, kp));
  const fraction = clampedKp / 9;

  const needleAngle = START_ANGLE_DEG + fraction * SWEEP_DEG;
  const needleTip = polarToCartesian(CX, CY, RADIUS - 8, needleAngle);
  const needleBase1 = polarToCartesian(CX, CY, 8, needleAngle + 90);
  const needleBase2 = polarToCartesian(CX, CY, 8, needleAngle - 90);

  const trackPath = describeArc(CX, CY, RADIUS, START_ANGLE_DEG, START_ANGLE_DEG + SWEEP_DEG);
  const activePath =
    fraction > 0
      ? describeArc(CX, CY, RADIUS, START_ANGLE_DEG, START_ANGLE_DEG + fraction * SWEEP_DEG)
      : null;

  const color = kpColor(clampedKp);

  return (
    <div
      className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col items-center gap-2"
    >
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest self-start">
        Kp Index
      </h2>

      {isError && !isLoading ? (
        <p className="text-sm text-red-400/80 mt-4">Failed to load Kp data.</p>
      ) : (
        <>
          <svg
            width="160"
            height="110"
            viewBox="0 0 160 120"
            role="meter"
            aria-valuenow={kp}
            aria-valuemin={0}
            aria-valuemax={9}
            aria-label="Planetary K-index"
            aria-description={label}
            className={cn(isLoading && 'opacity-40 animate-pulse')}
          >
            {/* Track arc */}
            <path
              d={trackPath}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Active arc */}
            {activePath && !isLoading && (
              <path
                d={activePath}
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
            )}

            {/* Needle */}
            {!isLoading && (
              <polygon
                points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
                fill={color}
                opacity={0.9}
              />
            )}

            {/* Center hub */}
            <circle cx={CX} cy={CY} r={6} fill="rgba(255,255,255,0.2)" />

            {/* Kp value label */}
            <text
              x={CX}
              y={CY + 30}
              textAnchor="middle"
              fontSize="22"
              fontWeight="700"
              fontFamily="monospace"
              fill="white"
              opacity={isLoading ? 0 : 1}
            >
              {clampedKp.toFixed(1)}
            </text>
          </svg>

          <p
            className={cn(
              'text-xs font-medium text-center',
              isLoading ? 'text-white/20' : 'text-white/60'
            )}
          >
            {isLoading ? 'Loading...' : label}
          </p>
        </>
      )}
    </div>
  );
}
