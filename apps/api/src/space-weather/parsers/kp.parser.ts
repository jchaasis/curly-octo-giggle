import { KpReading } from '@repo/shared';

// Strip non-numeric suffixes such as "+" or "-" that appear in NOAA Kp strings.
// Examples: "4+" → 4, "3.33" → 3.33, "4-" → 4.
// Returns null for any value that is negative (including the "-1" sentinel) or
// above the valid Kp scale ceiling of 9, or otherwise unparseable.
function parseKpValue(rawKp: unknown): number | null {
  const kpString = String(rawKp).trim();
  // Remove any trailing non-numeric characters (e.g. "+", "-", letters).
  const cleanedKp = kpString.replace(/[^0-9.]+$/, '');
  const parsedKp = parseFloat(cleanedKp);
  if (isNaN(parsedKp) || parsedKp < 0 || parsedKp > 9) return null;
  return parsedKp;
}

// Primary endpoint: /products/noaa-planetary-k-index.json
// Returns array-of-arrays: first row is a string header, remaining rows are data.
// Example: [["time_tag","Kp","Kp_index","station_count"], ["2024-01-01 00:00:00","2.33","2.67",13], ...]

function parsePrimaryKpRows(data: unknown[]): KpReading | null {
  const [header, ...rows] = data;
  if (!Array.isArray(header)) return null;

  const timeIdx = header.findIndex((h) => h === 'time_tag');
  const kpIdx = header.findIndex((h) => h === 'Kp');
  if (timeIdx === -1 || kpIdx === -1) return null;

  let latest: KpReading | null = null;

  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const time_tag = row[timeIdx];
    const rawKp = row[kpIdx];
    if (typeof time_tag !== 'string') continue;
    const kp = parseKpValue(rawKp);
    if (kp === null) continue;
    latest = { time_tag, kp, source: 'primary' };
  }

  return latest;
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
 * Primary format:  array-of-arrays — first row is header, rest are data rows
 * Fallback format: array-of-objects { time_tag, kp_index, ... }
 */
export function parseKp(
  data: unknown,
  source: 'primary' | 'fallback',
): KpReading | null {
  if (!Array.isArray(data) || data.length === 0) return null;

  if (source === 'primary') {
    return parsePrimaryKpRows(data);
  }

  // source === 'fallback': array-of-objects with kp_index field
  let latest: KpReading | null = null;
  for (const item of data) {
    if (!isFallbackKpObject(item)) continue;
    const kp = parseKpValue(item.kp_index);
    if (kp === null) continue;
    latest = { time_tag: item.time_tag, kp, source: 'fallback' };
  }
  return latest;
}
