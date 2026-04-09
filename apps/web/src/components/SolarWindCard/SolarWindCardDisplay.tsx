import { SparklineChart } from './SparklineChart';

interface SolarWindCardDisplayProps {
  speed: number | null;
  density: number | null;
  temperature: number | null;
  bz: number | null;
  speedHistory: number[];
  isLoading: boolean;
  isError: boolean;
}

function fmt(value: number | null, decimals = 1): string {
  if (value === null) return '---';
  return decimals === 0 ? Math.round(value).toLocaleString() : value.toFixed(decimals);
}

function bzColor(bz: number | null): string {
  if (bz === null) return 'var(--s-tx1)';
  return bz < 0 ? 'var(--s-red)' : 'var(--s-green)';
}

interface MetricProps {
  label: string;
  value: string;
  unit: string;
  color?: string;
  isLoading: boolean;
}

function Metric({ label, value, unit, color, isLoading }: MetricProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 8, color: 'var(--s-tx2)', letterSpacing: '2px', marginBottom: 3, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{
        fontSize: 20,
        fontFamily: 'Orbitron, sans-serif',
        fontWeight: 700,
        lineHeight: 1,
        color: isLoading ? 'var(--s-tx3)' : (color ?? 'var(--s-tx1)'),
        transition: 'color 0.5s',
        minHeight: 24,
      }}>
        {isLoading ? '--' : value}
      </div>
      <div style={{ fontSize: 9, color: 'var(--s-tx2)', marginTop: 2 }}>{unit}</div>
    </div>
  );
}

export function SolarWindCardDisplay({
  speed,
  density,
  temperature,
  bz,
  speedHistory,
  isLoading,
  isError,
}: SolarWindCardDisplayProps) {
  return (
    <div className="solaris-card">
      <div className="solaris-card-title">// SOLAR WIND — ACE / DSCOVR L1 POINT</div>

      {isError && !isLoading ? (
        <p style={{ fontSize: 11, color: 'var(--s-red)', letterSpacing: 1 }}>FAILED TO LOAD SOLAR WIND DATA</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            <Metric label="Speed" value={fmt(speed, 1)} unit="km/s" color="var(--s-cyan)" isLoading={isLoading} />
            <Metric label="Density" value={fmt(density, 1)} unit="p/cm³" color="var(--s-orange)" isLoading={isLoading} />
            <Metric label="Bz (GSM)" value={fmt(bz, 1)} unit="nT" color={bzColor(bz)} isLoading={isLoading} />
            <Metric label="Temp" value={fmt(temperature === null ? null : temperature / 1e4, 1)} unit="×10⁴ K" color="var(--s-yellow)" isLoading={isLoading} />
          </div>
          {!isLoading && speedHistory.length > 1 && (
            <SparklineChart readings={speedHistory} />
          )}
        </>
      )}
    </div>
  );
}
