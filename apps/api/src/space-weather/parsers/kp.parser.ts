import { KpReading } from '@repo/shared';

// Strip non-numeric suffixes such as "+" or "-" that appear in NOAA Kp strings.
// Examples: "4+" → 4, "3.33" → 3.33, "4-" → 4.
// Returns null for any value that is negative (including the "-1" sentinel) or
// above the valid Kp scale ceiling of 9, or otherwise unparseable.
function parseKpValue(raw: unknown): number | null {
  const str = String(raw).trim();
  // Remove any trailing non-numeric characters (e.g. "+", "-", letters).
  const cleaned = str.replace(/[^0-9.]+$/, '');
  const n = parseFloat(cleaned);
  if (isNaN(n) || n < 0 || n > 9) return null;
  return n;
}

// Primary endpoint: /products/noaa-planetary-k-index.json
// Returns array-of-objects with a capital "Kp" field (numeric).
interface PrimaryKpObject {
  time_tag: string;
  Kp: string | number;
}

function isPrimaryKpObject(value: unknown): value is PrimaryKpObject {
  if (typeof value !== 'object' || value === null) return false;
  return (
    typeof (value as Record<string, unknown>)['time_tag'] === 'string' &&
    'Kp' in (value as Record<string, unknown>)
  );
}

// Fallback endpoint: /json/planetary_k_index_1m.json
// Returns array-of-objects with a lowercase "kp_index" field.
interface FallbackKpObject {
  time_tag: string;
  kp_index: string | number;
}

function isFallbackKpObject(value: unknown): value is FallbackKpObject {
  if (typeof value !== 'object' || value === null) return false;
  return (
    typeof (value as Record<string, unknown>)['time_tag'] === 'string' &&
    'kp_index' in (value as Record<string, unknown>)
  );
}

/**
 * Extracts the latest valid Kp reading from raw NOAA data.
 *
 * Design note: returns only the most recent entry ("last entry wins") because
 * the dashboard only needs the current Kp index, not a full historical series.
 * If historical Kp data is ever needed, a separate `parseKpHistory` function
 * should be introduced rather than changing this one's contract.
 *
 * The `source` parameter is the sole format discriminator — the parser trusts
 * the caller to know which endpoint the data came from.
 *
 * Primary format:  array-of-objects { time_tag, Kp, ... }
 * Fallback format: array-of-objects { time_tag, kp_index, ... }
 */
export function parseKp(
  data: unknown,
  source: 'primary' | 'fallback',
): KpReading | null {
  if (!Array.isArray(data) || data.length === 0) return null;

  let latest: KpReading | null = null;

  if (source === 'primary') {
    for (const item of data) {
      if (!isPrimaryKpObject(item)) continue;
      const kp = parseKpValue(item.Kp);
      if (kp === null) continue;
      latest = { time_tag: item.time_tag, kp, source: 'primary' };
    }
    return latest;
  }

  // source === 'fallback': array-of-objects with kp_index field
  for (const item of data) {
    if (!isFallbackKpObject(item)) continue;
    const kp = parseKpValue(item.kp_index);
    if (kp === null) continue;
    latest = { time_tag: item.time_tag, kp, source: 'fallback' };
  }
  return latest;
}
