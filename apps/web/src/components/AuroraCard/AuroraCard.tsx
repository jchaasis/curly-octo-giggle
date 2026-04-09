import { cn } from '@/lib/utils';
import { getAuroraStatus } from '@/lib/aurora';

interface AuroraCardProps {
  kp: number | undefined;
  latitude: number | null;
  isLoading: boolean;
  isError: boolean;
}

const TIER_COLORS: Record<number, string> = {
  0: 'bg-white/10',
  1: 'bg-blue-500/30',
  2: 'bg-blue-500/50',
  3: 'bg-teal-500/60',
  4: 'bg-green-500/70',
  5: 'bg-green-400/80',
};

const TIER_TEXT_COLORS: Record<number, string> = {
  0: 'text-white/40',
  1: 'text-blue-300',
  2: 'text-blue-200',
  3: 'text-teal-200',
  4: 'text-green-200',
  5: 'text-green-100',
};

export function AuroraCard({ kp, latitude, isLoading, isError }: AuroraCardProps) {
  const hasData = kp !== undefined && latitude !== null;
  const status = hasData ? getAuroraStatus(kp, latitude) : null;

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3">
      <div>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          Aurora Visibility
        </h2>
        <p className="text-xs text-white/30 mt-0.5">Aurora visibility for your location</p>
      </div>

      {isError && !isLoading ? (
        <p className="text-sm text-red-400/80">Failed to load aurora data.</p>
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <div className="h-5 w-24 rounded bg-white/10 animate-pulse" />
          <div className="h-2 w-full rounded-full bg-white/10 animate-pulse" />
        </div>
      ) : !hasData ? (
        <p className="text-sm text-white/40">
          {latitude === null
            ? 'Set your location to see aurora visibility.'
            : 'Waiting for Kp data...'}
        </p>
      ) : status !== null ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={cn('text-sm font-semibold', TIER_TEXT_COLORS[status.tier])}>
              {status.label}
            </span>
            <span className="text-xs text-white/40">
              Tier {status.tier}/5
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                TIER_COLORS[status.tier]
              )}
              style={{ width: `${status.progress * 100}%` }}
            />
          </div>

          <p className="text-xs text-white/30">
            Kp {kp.toFixed(1)} at {latitude.toFixed(2)}° lat
          </p>
        </div>
      ) : null}
    </div>
  );
}
