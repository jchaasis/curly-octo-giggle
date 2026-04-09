import { Alert } from '@repo/shared';

// NOAA alert field names vary slightly between endpoints.
export function parseAlerts(raw: unknown): Alert[] {
  if (!Array.isArray(raw)) return [];

  const alerts: Alert[] = [];

  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;

    const r = item as Record<string, unknown>;

    // NOAA uses 'issue_time' or 'issue_datetime' depending on the feed.
    const issue_time =
      typeof r['issue_time'] === 'string'
        ? r['issue_time']
        : typeof r['issue_datetime'] === 'string'
          ? r['issue_datetime']
          : null;

    if (!issue_time) continue;

    const product_id =
      typeof r['product_id'] === 'string' ? r['product_id'] : null;
    if (!product_id) continue;

    // A missing message body is treated as an empty string rather than a skip.
    // NOAA occasionally issues cancellation or summary alerts with no body text.
    const message =
      typeof r['message'] === 'string' ? r['message'] : '';

    alerts.push({ issue_time, product_id, message });
  }

  return alerts;
}
