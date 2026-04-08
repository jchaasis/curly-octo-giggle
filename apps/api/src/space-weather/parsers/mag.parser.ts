import { MagReading } from '@repo/shared';

// NOAA magnetometer array format includes both GSE and GSM columns.
// We use the GSM (Geocentric Solar Magnetospheric) frame for bz, as it is the
// standard frame for geomagnetic storm / aurora analysis.
// The "Bz_gsm" column position is found dynamically from the header row.

interface MagObject {
  time_tag: string;
  bz_gsm: string | number;
}

function isMagObject(value: unknown): value is MagObject {
  if (typeof value !== 'object' || value === null) return false;
  return (
    typeof (value as Record<string, unknown>)['time_tag'] === 'string' &&
    'bz_gsm' in (value as Record<string, unknown>)
  );
}

// Returns null for unparseable or NOAA sentinel values (e.g. "N/A", "-9999.9", "").
// Callers must treat null as "measurement unavailable", not zero.
function toNullableNumber(value: unknown): number | null {
  const n = parseFloat(String(value));
  return isNaN(n) ? null : n;
}

export function parseMag(data: unknown): MagReading[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  if (Array.isArray(data[0])) {
    // First row is the header — find bz_gsm column dynamically.
    const header = data[0] as unknown[];
    const bzCol = header.findIndex(
      (h) => typeof h === 'string' && h.trim().toLowerCase() === 'bz_gsm',
    );
    if (bzCol === -1) return [];

    const rows = data.slice(1) as unknown[];
    const results: MagReading[] = [];

    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      const timeTag = row[0];
      if (typeof timeTag !== 'string' || timeTag === '') continue;

      results.push({
        time_tag: timeTag,
        bz: toNullableNumber(row[bzCol]),
      });
    }

    return results;
  }

  // array-of-objects format
  const results: MagReading[] = [];

  for (const item of data) {
    if (!isMagObject(item)) continue;
    results.push({
      time_tag: item.time_tag,
      bz: toNullableNumber(item.bz_gsm),
    });
  }

  return results;
}
