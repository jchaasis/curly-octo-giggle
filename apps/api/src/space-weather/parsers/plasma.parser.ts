import { SolarWind } from '@repo/shared';
import { toNullableNumber } from './parse-utils';

// NOAA array-of-arrays column order for the plasma/solar wind endpoint.
// Index 0 is time_tag (after skipping the header row).
const COL_TIME_TAG = 0;
const COL_DENSITY = 1;
const COL_SPEED = 2;
const COL_TEMPERATURE = 3;

interface PlasmaObject {
  time_tag: string;
  speed: string | number;
  density: string | number;
  temperature: string | number;
}

function isPlasmaObject(value: unknown): value is PlasmaObject {
  if (typeof value !== 'object' || value === null) return false;
  return (
    typeof (value as Record<string, unknown>)['time_tag'] === 'string' &&
    'speed' in (value as Record<string, unknown>) &&
    'density' in (value as Record<string, unknown>) &&
    'temperature' in (value as Record<string, unknown>)
  );
}


export function parsePlasma(data: unknown): SolarWind[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  // Detect format: if the first element is itself an array it is array-of-arrays.
  if (Array.isArray(data[0])) {
    // First row is the header — skip it.
    const rows = data.slice(1) as unknown[];
    const results: SolarWind[] = [];

    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      const timeTag = row[COL_TIME_TAG];
      if (typeof timeTag !== 'string' || timeTag === '') continue;

      results.push({
        time_tag: timeTag,
        density: toNullableNumber(row[COL_DENSITY]),
        speed: toNullableNumber(row[COL_SPEED]),
        temperature: toNullableNumber(row[COL_TEMPERATURE]),
        bz: null, // populated by the service after joining with the mag feed
      });
    }

    return results;
  }

  // array-of-objects format
  const results: SolarWind[] = [];

  for (const item of data) {
    if (!isPlasmaObject(item)) continue;
    results.push({
      time_tag: item.time_tag,
      speed: toNullableNumber(item.speed),
      density: toNullableNumber(item.density),
      temperature: toNullableNumber(item.temperature),
      bz: null, // populated by the service after joining with the mag feed
    });
  }

  return results;
}
