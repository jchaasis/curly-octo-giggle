import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/hooks/useLocation';
import { useLocationStore } from '@/stores/locationStore';
import { searchCity } from '@/services/geocode';
import { cn } from '@/lib/utils';
import type { GeoResult } from '@repo/shared';

export function LocationModal() {
  const { setByGPS } = useLocation();
  const setLocation = useLocationStore((s) => s.setLocation);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const found = await searchCity(trimmed);
      if (found.length === 0) {
        setError('No results found. Try a different city name.');
      } else {
        setResults(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleResultClick(result: GeoResult) {
    setLocation({ lat: result.lat, lon: result.lon, displayName: result.displayName });
    try {
      localStorage.setItem('solaris:location', JSON.stringify(result));
    } catch {
      // localStorage may be unavailable
    }
  }

  async function handleGPS() {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      await setByGPS();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to get GPS location. Please search by city.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      void handleSearch();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-2xl">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">SOLARIS</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Set your location to receive personalised space-weather data.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search city…"
            disabled={loading}
            className={cn(
              'flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground',
              'outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />
          <Button onClick={() => void handleSearch()} disabled={loading || !query.trim()}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </div>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => void handleGPS()}
          disabled={loading}
        >
          {loading ? 'Locating…' : 'Use GPS'}
        </Button>

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {results.length > 0 && (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
            {results.map((r) => (
              <li key={`${r.lat}-${r.lon}`}>
                <button
                  type="button"
                  onClick={() => handleResultClick(r)}
                  className={cn(
                    'w-full px-4 py-3 text-left text-sm text-foreground',
                    'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
                    'transition-colors',
                  )}
                >
                  {r.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
