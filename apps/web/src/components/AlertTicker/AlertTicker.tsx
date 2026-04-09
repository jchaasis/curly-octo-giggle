import { useState } from 'react';
import type { Alert } from '@repo/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AlertTickerProps {
  alerts: Alert[];
  isLoading: boolean;
  isError: boolean;
}

function formatUtcTime(iso: string): string {
  return new Date(iso).toUTCString().replace(' GMT', ' UTC');
}

interface AlertItemProps {
  alert: Alert;
}

function AlertItem({ alert }: AlertItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isNominal = alert.product_id === 'NOMINAL';

  return (
    <li
      className={cn(
        'rounded-lg border px-3 py-2 flex flex-col gap-1',
        isNominal
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-white/5 border-white/10'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'text-xs font-bold tracking-wide',
            isNominal ? 'text-green-400' : 'text-yellow-300'
          )}
        >
          {alert.product_id}
        </span>
        <span className="text-xs text-white/30 shrink-0">
          {formatUtcTime(alert.issue_time)}
        </span>
      </div>

      <p
        className={cn(
          'text-xs text-white/60 leading-relaxed',
          !expanded && 'line-clamp-2'
        )}
      >
        {alert.message}
      </p>

      {alert.message.length > 120 && (
        <Button
          variant="ghost"
          size="xs"
          className="self-start text-white/30 hover:text-white/60 px-0 h-auto"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </li>
  );
}

export function AlertTicker({ alerts, isLoading, isError }: AlertTickerProps) {
  return (
    <div
      role="log"
      aria-live="polite"
      className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3"
    >
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
        Space Weather Alerts
      </h2>

      {isError && !isLoading ? (
        <p className="text-sm text-red-400/80">Failed to load alert data.</p>
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {alerts.map((alert, idx) => (
            <AlertItem key={`${alert.issue_time}-${idx}`} alert={alert} />
          ))}
        </ul>
      )}
    </div>
  );
}
