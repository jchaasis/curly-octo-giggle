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
    <header className="solaris-header">
      {/* Top row: logo + (desktop: location center) + right controls */}
      <div className="solaris-header-top">
        {/* Logo */}
        <div style={{ flexShrink: 0 }}>
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

        {/* Center: location — desktop only */}
        {displayName && (
          <div className="solaris-header-location-desktop">
            <span style={{ color: 'var(--s-cyan)', fontSize: 13, flexShrink: 0 }}>◈</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'var(--s-tx1)', letterSpacing: '1px', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

        {/* Right: live dot + clock (desktop) + buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: 'var(--s-green)',
            boxShadow: '0 0 8px var(--s-green)',
            animation: 'solaris-pulse 2s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <div className="solaris-header-clock">
            {formatUtcClock(now)}
          </div>
          <div className="solaris-header-buttons">
            <button className="solaris-btn solaris-btn--cyan" onClick={onSync}>
              ↻ SYNC
            </button>
            <button className="solaris-btn solaris-btn--outline" onClick={onSwitchLocation}>
              ⊕ LOCATION
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: location + timestamp — mobile only */}
      {displayName && (
        <div className="solaris-header-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ color: 'var(--s-cyan)', fontSize: 11, flexShrink: 0 }}>◈</span>
            <div style={{ color: 'var(--s-tx1)', letterSpacing: '1px', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--s-tx2)', letterSpacing: '1px' }}>
              {formatUtcClock(now)}
            </div>
            {lastSyncedAt && (
              <div style={{ color: 'var(--s-tx2)', fontSize: 9 }}>
                SYNCED {lastSyncedAt.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
