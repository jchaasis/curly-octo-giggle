import { Alert } from '@repo/shared';

// NOAA alert field names vary slightly between endpoints.
export function parseAlerts(rawAlerts: unknown): Alert[] {
  if (!Array.isArray(rawAlerts)) return [];

  const alerts: Alert[] = [];

  for (const item of rawAlerts) {
    if (typeof item !== 'object' || item === null) continue;

    const alertData = item as Record<string, unknown>;

    // NOAA uses 'issue_time' or 'issue_datetime' depending on the feed.
    const issue_time =
      typeof alertData['issue_time'] === 'string'
        ? alertData['issue_time']
        : typeof alertData['issue_datetime'] === 'string'
          ? alertData['issue_datetime']
          : null;

    if (!issue_time) continue;

    const product_id =
      typeof alertData['product_id'] === 'string' ? alertData['product_id'] : null;
    if (!product_id) continue;

    // A missing message body is treated as an empty string rather than a skip.
    // NOAA occasionally issues cancellation or summary alerts with no body text.
    const message =
      typeof alertData['message'] === 'string' ? alertData['message'] : '';

    alerts.push({ issue_time, product_id, message });
  }

  return alerts;
}
