import type { Flare } from '@repo/shared';
import { cn } from '@/lib/utils';

interface FlareListProps {
  flares: Flare[];
  activeClass: string | null;
  isLoading: boolean;
  isError: boolean;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toUTCString().replace(' GMT', ' UTC');
}

function scaleBadgeColor(scale: string): string {
  const letter = scale.charAt(0).toUpperCase();
  if (letter === 'X') return 'bg-red-500/20 text-red-300 border-red-500/40';
  if (letter === 'M') return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  if (letter === 'C') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
  return 'bg-white/10 text-white/60 border-white/20';
}

export function FlareList({ flares, activeClass, isLoading, isError }: FlareListProps) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          Solar Flares
        </h2>
        {activeClass && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">
            Active: {activeClass}
          </span>
        )}
      </div>

      {isError && !isLoading ? (
        <p className="text-sm text-red-400/80">Failed to load flare data.</p>
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : flares.length === 0 ? (
        <p className="text-sm text-white/40 py-2">No flares in the past 7 days.</p>
      ) : (
        <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {flares.map((flare, idx) => (
            <li
              key={`${flare.begin_time}-${idx}`}
              className="flex flex-col gap-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-bold px-1.5 py-0.5 rounded border',
                    scaleBadgeColor(flare.scale)
                  )}
                >
                  {flare.scale}
                </span>
                <span className="text-xs text-white/40">
                  Begin: {formatTime(flare.begin_time)}
                </span>
              </div>
              <p className="text-xs text-white/50">
                Peak:{' '}
                {flare.peak_time ? formatTime(flare.peak_time) : (
                  <span className="italic text-yellow-400/70">in progress</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
