import { useState } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { useLocationStore } from '@/stores/locationStore';
import { searchCity } from '@/services/geocode';
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
        setError('NO RESULTS FOUND. TRY A DIFFERENT CITY NAME.');
      } else if (found.length === 1) {
        handleResultClick(found[0]);
      } else {
        setResults(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message.toUpperCase() : 'SEARCH FAILED. PLEASE TRY AGAIN.');
    } finally {
      setLoading(false);
    }
  }

  function handleResultClick(result: GeoResult) {
    setLocation({ lat: result.lat, lon: result.lon, displayName: result.displayName });
    try {
      localStorage.setItem('solaris:location', JSON.stringify(result));
    } catch {
      // localStorage unavailable
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
        err instanceof Error
          ? err.message.toUpperCase()
          : 'UNABLE TO GET GPS LOCATION.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,4,9,0.95)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--s-bg1)',
        border: '1px solid var(--s-border2)',
        padding: '40px 48px',
        maxWidth: 480, width: '90%',
        position: 'relative',
      }}>
        {/* Cyan top accent line */}
        <div style={{
          position: 'absolute', top: -1, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, var(--s-cyan), transparent)',
        }} />

        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 28, fontWeight: 900,
          letterSpacing: '8px',
          color: 'var(--s-cyan)',
          marginBottom: 6,
        }}>
          SOLARIS
        </div>
        <div style={{ fontSize: 10, color: 'var(--s-tx2)', letterSpacing: '3px', marginBottom: 32 }}>
          SPACE WEATHER COMMAND CENTER
        </div>

        <div style={{ fontSize: 10, color: 'var(--s-cyan)', letterSpacing: '3px', marginBottom: 10 }}>
          // ENTER YOUR LOCATION
        </div>

        <input
          className="solaris-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch(); }}
          placeholder="City, State or Country"
          disabled={loading}
          autoComplete="off"
        />

        {/* Status message */}
        {loading && (
          <div style={{ fontSize: 11, color: 'var(--s-cyan)', marginTop: 10, animation: 'solaris-pulse 1s ease-in-out infinite', letterSpacing: '1px' }}>
            ACQUIRING COORDINATES...
          </div>
        )}
        {error && !loading && (
          <div style={{ fontSize: 11, color: 'var(--s-red)', marginTop: 10, letterSpacing: '1px', minHeight: 16 }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button
            onClick={() => void handleSearch()}
            disabled={loading || !query.trim()}
            style={{
              flex: 1,
              background: 'var(--s-cyan)',
              color: 'var(--s-bg)',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '3px',
              padding: 12,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: (loading || !query.trim()) ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            INITIALIZE
          </button>
          <button
            className="solaris-btn solaris-btn--gps"
            onClick={() => void handleGPS()}
            disabled={loading}
          >
            ⊕ USE GPS
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--s-border)' }}>
            {results.map((r) => (
              <button
                key={`${r.lat}-${r.lon}`}
                className="solaris-result-btn"
                onClick={() => handleResultClick(r)}
              >
                {r.displayName}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
