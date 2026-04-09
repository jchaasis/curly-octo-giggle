import { useState, useEffect } from 'react';

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

export function Header({ displayName, lastSyncedAt, onSync, onSwitchLocation }: HeaderProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{
      position: 'relative',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '13px 24px',
      borderBottom: '1px solid var(--s-border)',
      background: 'rgba(2,4,9,0.85)',
      backdropFilter: 'blur(10px)',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: '6px',
          color: 'var(--s-cyan)',
        }}>
          SOLARIS
        </div>
        <div style={{ fontSize: 9, color: 'var(--s-tx2)', letterSpacing: '3px', marginTop: 2 }}>
          SPACE WEATHER COMMAND
        </div>
      </div>

      {/* Center: location */}
      {displayName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <span style={{ color: 'var(--s-cyan)', fontSize: 13 }}>◈</span>
          <div>
            <div style={{ color: 'var(--s-tx1)', letterSpacing: '1px', fontSize: 12 }}>
              {displayName}
            </div>
            {lastSyncedAt && (
              <div style={{ color: 'var(--s-tx2)', fontSize: 10 }}>
                SYNCED {lastSyncedAt.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right: live dot + clock + buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: 'var(--s-green)',
          boxShadow: '0 0 8px var(--s-green)',
          animation: 'solaris-pulse 2s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <div style={{ fontSize: 11, color: 'var(--s-tx2)', letterSpacing: '1px' }}>
          {formatUtcClock(now)}
        </div>
        <button className="solaris-btn solaris-btn--cyan" onClick={onSync}>
          ↻ SYNC
        </button>
        <button className="solaris-btn solaris-btn--outline" onClick={onSwitchLocation}>
          ⊕ LOCATION
        </button>
      </div>
    </header>
  );
}
