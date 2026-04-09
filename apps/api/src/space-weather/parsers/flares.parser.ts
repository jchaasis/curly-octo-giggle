import { Flare } from '@repo/shared';

// NOAA flare data field names vary by endpoint/version.
// We handle the known aliases here to stay robust against minor API changes.
export function parseFlares(raw: unknown): Flare[] {
  if (!Array.isArray(raw)) return [];

  const flares: Flare[] = [];

  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;

    const r = item as Record<string, unknown>;

    const begin_time =
      typeof r['begin_time'] === 'string'
        ? r['begin_time']
        : typeof r['begin_datetime'] === 'string'
          ? r['begin_datetime']
          : null;

    if (!begin_time) continue;

    // NOAA uses 'class', 'scale', or 'max_class' depending on endpoint.
    const scaleRaw =
      typeof r['class'] === 'string'
        ? r['class']
        : typeof r['scale'] === 'string'
          ? r['scale']
          : typeof r['max_class'] === 'string'
            ? r['max_class']
            : null;

    if (!scaleRaw || scaleRaw.trim() === '') continue;

    const scale = scaleRaw.trim();
    const class_letter = scale.charAt(0).toUpperCase();

    // NOAA uses 'peak_time' or 'max_time' depending on the endpoint.
    const peak_time =
      typeof r['peak_time'] === 'string'
        ? r['peak_time']
        : typeof r['max_time'] === 'string'
          ? r['max_time']
          : null;
    const end_time =
      typeof r['end_time'] === 'string' ? r['end_time'] : null;

    // Unknown element types (e.g. nested event objects) are coerced to strings
    // defensively. Unknown flare class letters (e.g. historical 'S' subflares)
    // are kept as-is and handled by the consumer's class ranking logic.
    const linked_events = Array.isArray(r['linked_events'])
      ? (r['linked_events'] as unknown[]).map((e) => String(e))
      : null;

    flares.push({ begin_time, peak_time, end_time, class_letter, scale, linked_events });
  }

  return flares;
}
