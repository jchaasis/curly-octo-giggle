import { Flare } from '@repo/shared';

// NOAA flare data field names vary by endpoint/version.
// We handle the known aliases here to stay robust against minor API changes.
export function parseFlares(rawFlares: unknown): Flare[] {
  if (!Array.isArray(rawFlares)) return [];

  const flares: Flare[] = [];

  for (const item of rawFlares) {
    if (typeof item !== 'object' || item === null) continue;

    const flareData = item as Record<string, unknown>;

    const begin_time =
      typeof flareData['begin_time'] === 'string'
        ? flareData['begin_time']
        : typeof flareData['begin_datetime'] === 'string'
          ? flareData['begin_datetime']
          : null;

    if (!begin_time) continue;

    // NOAA uses 'class', 'scale', or 'max_class' depending on endpoint.
    const rawClassString =
      typeof flareData['class'] === 'string'
        ? flareData['class']
        : typeof flareData['scale'] === 'string'
          ? flareData['scale']
          : typeof flareData['max_class'] === 'string'
            ? flareData['max_class']
            : null;

    if (!rawClassString || rawClassString.trim() === '') continue;

    const classString = rawClassString.trim();
    const class_letter = classString.charAt(0).toUpperCase();

    // NOAA uses 'peak_time' or 'max_time' depending on the endpoint.
    const peak_time =
      typeof flareData['peak_time'] === 'string'
        ? flareData['peak_time']
        : typeof flareData['max_time'] === 'string'
          ? flareData['max_time']
          : null;
    const end_time =
      typeof flareData['end_time'] === 'string' ? flareData['end_time'] : null;

    // Unknown element types (e.g. nested event objects) are coerced to strings
    // defensively. Unknown flare class letters (e.g. historical 'S' subflares)
    // are kept as-is and handled by the consumer's class ranking logic.
    const linked_events = Array.isArray(flareData['linked_events'])
      ? (flareData['linked_events'] as unknown[]).map((e) => String(e))
      : null;

    flares.push({ begin_time, peak_time, end_time, class_letter, scale: classString, linked_events });
  }

  return flares;
}
