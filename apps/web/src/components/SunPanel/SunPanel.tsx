interface SunPanelProps {
  activeClass: string | null | undefined;
}

function getFlareIntensity(activeClass: string | null | undefined): number {
  // Returns 0–1; drives flare tendril scale
  if (!activeClass) return 0.3;
  const letter = activeClass.charAt(0).toUpperCase();
  if (letter === 'X') return 1.0;
  if (letter === 'M') return 0.75;
  if (letter === 'C') return 0.5;
  return 0.3;
}

function getBadgeColor(activeClass: string | null | undefined): string {
  if (!activeClass) return 'var(--s-cyan)';
  const letter = activeClass.charAt(0).toUpperCase();
  if (letter === 'X') return 'var(--s-red)';
  if (letter === 'M') return 'var(--s-orange)';
  if (letter === 'C') return 'var(--s-yellow)';
  return 'var(--s-green)';
}

export function SunPanel({ activeClass }: SunPanelProps) {
  const isUnknown = activeClass === undefined;
  const badgeLabel = isUnknown ? '—' : (activeClass ?? 'QUIET');
  const badgeColor = getBadgeColor(isUnknown ? null : activeClass);
  const intensity = getFlareIntensity(activeClass);

  // Flare scale: full at intensity 1, minimal at 0.3
  const flareScale = 0.6 + intensity * 0.8;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        position: 'relative',
        zIndex: 1,
        width: '100%',
      }}
    >
      {/* Sun wrap */}
      <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Rings */}
        <div style={{
          position: 'absolute',
          width: 180, height: 180,
          borderRadius: '50%',
          border: '1px solid rgba(255,100,0,0.18)',
          animation: 'ring-pulse 3.5s ease-in-out infinite',
          animationDelay: '0s',
        }} />
        <div style={{
          position: 'absolute',
          width: 152, height: 152,
          borderRadius: '50%',
          border: '1px solid rgba(255,160,0,0.28)',
          animation: 'ring-pulse 3.5s ease-in-out infinite',
          animationDelay: '0.6s',
        }} />
        <div style={{
          position: 'absolute',
          width: 126, height: 126,
          borderRadius: '50%',
          border: '1px solid rgba(255,200,0,0.38)',
          animation: 'ring-pulse 3.5s ease-in-out infinite',
          animationDelay: '1.2s',
        }} />

        {/* Sun core */}
        <div style={{
          position: 'relative',
          width: 96, height: 96,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 32%, #FFF5CC 0%, #FFD000 18%, #FF8C00 45%, #CC3300 75%, #7A1500 100%)',
          boxShadow: '0 0 28px rgba(255,140,0,0.55), 0 0 56px rgba(255,80,0,0.3), 0 0 90px rgba(255,50,0,0.15)',
          animation: 'sun-breathe 4s ease-in-out infinite',
        }}>
          {/* Flare tendrils — 4 compass points */}
          {/* North */}
          <div style={{
            position: 'absolute',
            width: 10, height: 28 * flareScale,
            top: -(28 * flareScale - 2),
            left: 43,
            borderRadius: '50% 50% 0 0',
            background: 'linear-gradient(to top, rgba(255,150,0,0.65), rgba(255,230,120,0.05))',
            transformOrigin: 'center bottom',
            animation: 'flare-anim 5s ease-in-out infinite',
          }} />
          {/* East */}
          <div style={{
            position: 'absolute',
            width: 8, height: 20 * flareScale,
            top: 9,
            right: -(20 * flareScale - 2),
            borderRadius: '50% 50% 0 0',
            background: 'linear-gradient(to top, rgba(255,150,0,0.65), rgba(255,230,120,0.05))',
            transformOrigin: 'center bottom',
            transform: 'rotate(90deg)',
            animation: 'flare-anim 5s ease-in-out infinite',
            animationDelay: '1.5s',
          }} />
          {/* South */}
          <div style={{
            position: 'absolute',
            width: 9, height: 24 * flareScale,
            bottom: -(24 * flareScale - 2),
            left: 44,
            borderRadius: '50% 50% 0 0',
            background: 'linear-gradient(to top, rgba(255,150,0,0.65), rgba(255,230,120,0.05))',
            transformOrigin: 'center bottom',
            transform: 'rotate(180deg)',
            animation: 'flare-anim 5s ease-in-out infinite',
            animationDelay: '3s',
          }} />
          {/* West */}
          <div style={{
            position: 'absolute',
            width: 7, height: 18 * flareScale,
            top: 11,
            left: -(18 * flareScale - 2),
            borderRadius: '50% 50% 0 0',
            background: 'linear-gradient(to top, rgba(255,150,0,0.65), rgba(255,230,120,0.05))',
            transformOrigin: 'center bottom',
            transform: 'rotate(-90deg)',
            animation: 'flare-anim 5s ease-in-out infinite',
            animationDelay: '4s',
          }} />
        </div>
      </div>

      {/* Flare class badge */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 9,
          color: 'var(--s-tx2)',
          letterSpacing: '3px',
          marginBottom: 4,
          textTransform: 'uppercase',
        }}>
          ACTIVE FLARE CLASS
        </div>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 48,
          fontWeight: 900,
          color: badgeColor,
          textShadow: `0 0 24px ${badgeColor}80`,
          lineHeight: 1,
          letterSpacing: '3px',
        }}>
          {badgeLabel}
        </div>
      </div>
    </div>
  );
}
