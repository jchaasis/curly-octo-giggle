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

interface KpObject {
  time_tag: string;
  kp_index: string | number;
}

function isKpObject(value: unknown): value is KpObject {
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
 */
export function parseKp(
  data: unknown,
  source: 'primary' | 'fallback',
): KpReading | null {
  if (!Array.isArray(data) || data.length === 0) return null;

  if (source === 'primary') {
    // array-of-objects
    let latest: KpReading | null = null;

    for (const item of data) {
      if (!isKpObject(item)) continue;
      const kp = parseKpValue(item.kp_index);
      if (kp === null) continue;
      latest = { time_tag: item.time_tag, kp, source: 'primary' };
    }

    return latest;
  }

  // source === 'fallback': array-of-arrays with a dynamic header row
  if (!Array.isArray(data[0])) return null;

  const header = data[0] as unknown[];
  const kpColIndex = header.findIndex(
    (h) => typeof h === 'string' && h.trim() === 'Kp',
  );
  if (kpColIndex === -1) return null;

  const TIME_TAG_COL = 0;
  let latest: KpReading | null = null;

  // Skip the header row (index 0).
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;
    const timeTag = row[TIME_TAG_COL];
    if (typeof timeTag !== 'string' || timeTag === '') continue;

    const kp = parseKpValue(row[kpColIndex]);
    if (kp === null) continue;

    latest = { time_tag: timeTag, kp, source: 'fallback' };
  }

  return latest;
}
