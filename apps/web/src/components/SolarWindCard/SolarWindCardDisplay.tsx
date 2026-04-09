import { cn } from '@/lib/utils';

interface SolarWindCardDisplayProps {
  speed: number | null;
  density: number | null;
  temperature: number | null;
  isLoading: boolean;
  isError: boolean;
}

function formatMetric(value: number | null, decimals = 1): string {
  if (value === null) return '—';
  return decimals === 0 ? value.toLocaleString() : value.toFixed(decimals);
}

interface MetricRowProps {
  label: string;
  value: string;
  isLoading: boolean;
}

function MetricRow({ label, value, isLoading }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
      <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</span>
      <span
        className={cn(
          'text-sm font-mono font-semibold tabular-nums',
          isLoading
            ? 'bg-white/10 text-transparent rounded animate-pulse w-16 text-right'
            : 'text-white'
        )}
      >
        {isLoading ? '\u00a0' : value}
      </span>
    </div>
  );
}

export function SolarWindCardDisplay({
  speed,
  density,
  temperature,
  isLoading,
  isError,
}: SolarWindCardDisplayProps) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-1">
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
        Solar Wind
      </h2>

      {isError && !isLoading ? (
        <p className="text-sm text-red-400/80">Failed to load solar wind data.</p>
      ) : (
        <>
          <MetricRow
            label="Speed (km/s)"
            value={formatMetric(speed, 1)}
            isLoading={isLoading}
          />
          <MetricRow
            label="Density (p/cc)"
            value={formatMetric(density, 1)}
            isLoading={isLoading}
          />
          <MetricRow
            label="Temperature (K)"
            value={formatMetric(temperature, 0)}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
