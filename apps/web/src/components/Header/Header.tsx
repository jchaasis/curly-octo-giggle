import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  displayName: string | null;
  lastSyncedAt: Date | null;
  onSync: () => void;
  onSwitchLocation: () => void;
}

function formatUtcClock(date: Date): string {
  const hh = date.getUTCHours().toString().padStart(2, '0');
  const mm = date.getUTCMinutes().toString().padStart(2, '0');
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss} UTC`;
}

function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function Header({ displayName, lastSyncedAt, onSync, onSwitchLocation }: HeaderProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-widest text-white">SOLARIS</h1>
        <p className="text-xs text-white/40 tracking-wide">Space Weather Command Center</p>
      </div>

      <div className="flex flex-col items-start sm:items-end gap-1 text-xs text-white/40">
        <span className="font-mono text-sm text-white/70">{formatUtcClock(now)}</span>
        {displayName && (
          <span>
            Location:{' '}
            <span className="text-white/60">{displayName}</span>
          </span>
        )}
        <span>
          Last synced:{' '}
          <span className="text-white/60">
            {lastSyncedAt ? formatLocalTime(lastSyncedAt) : '—'}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSync}>
          Sync
        </Button>
        <Button variant="secondary" size="sm" onClick={onSwitchLocation}>
          Switch Location
        </Button>
      </div>
    </header>
  );
}
