// Returns null for unparseable or NOAA sentinel values (e.g. "N/A", "-9999.9", "").
// Callers must treat null as "measurement unavailable", not zero.
export function toNullableNumber(value: unknown): number | null {
  const n = parseFloat(String(value));
  return isNaN(n) ? null : n;
}
