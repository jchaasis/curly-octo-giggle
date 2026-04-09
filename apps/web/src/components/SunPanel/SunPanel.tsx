import { cn } from '@/lib/utils';

interface SunPanelProps {
  activeClass: string | null | undefined;
}

function getClassLetter(activeClass: string | null): string {
  if (!activeClass) return 'A';
  return activeClass.charAt(0).toUpperCase();
}

function getBadgeColor(letter: string): string {
  switch (letter) {
    case 'X':
      return 'bg-red-500/20 text-red-400 border-red-500/40';
    case 'M':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    case 'C':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    default:
      return 'bg-green-500/20 text-green-400 border-green-500/40';
  }
}

export function SunPanel({ activeClass }: SunPanelProps) {
  const isUnknown = activeClass === undefined;
  const letter = isUnknown ? '?' : getClassLetter(activeClass);
  const badgeLabel = isUnknown ? '—' : (activeClass ?? 'A');
  const badgeColor = isUnknown
    ? 'bg-white/10 text-white/40 border-white/20'
    : getBadgeColor(letter);

  return (
    <div className="relative rounded-lg border border-white/10 bg-white/5 p-6 flex flex-col items-center justify-center min-h-[200px] overflow-hidden">
      {/* Panel label */}
      <p className="absolute top-4 left-4 text-xs font-semibold uppercase tracking-widest text-white/40">
        Sun Activity
      </p>

      {/* Active class badge */}
      <div
        className={cn(
          'absolute top-4 right-4 rounded-full border px-2 py-0.5 text-xs font-bold tracking-wide',
          badgeColor,
        )}
      >
        {badgeLabel}
      </div>

      {/* Sun visualization */}
      <div className="relative flex items-center justify-center">
        {/* Outer ping ring */}
        <span
          className="absolute inline-flex rounded-full bg-orange-400/20 animate-ping"
          style={{ width: '9rem', height: '9rem', animationDelay: '0.4s', animationDuration: '3s' }}
        />
        {/* Middle ping ring */}
        <span
          className="absolute inline-flex rounded-full bg-orange-400/25 animate-ping"
          style={{ width: '7rem', height: '7rem', animationDelay: '0.2s', animationDuration: '3s' }}
        />
        {/* Inner pulse ring */}
        <span
          className="absolute inline-flex rounded-full bg-orange-400/30 animate-pulse"
          style={{ width: '5.5rem', height: '5.5rem', animationDuration: '2s' }}
        />
        {/* Sun core */}
        <div
          className="relative z-10 rounded-full"
          style={{
            width: '4rem',
            height: '4rem',
            background:
              'radial-gradient(circle at 40% 35%, #fff7ed 0%, #fbbf24 40%, #f97316 75%, #ea580c 100%)',
            boxShadow: '0 0 24px 6px rgba(251, 191, 36, 0.4), 0 0 48px 12px rgba(249, 115, 22, 0.2)',
          }}
        />
      </div>
    </div>
  );
}
