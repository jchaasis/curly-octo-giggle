import { parseKp } from './kp.parser';
import { KpReading } from '@repo/shared';

describe('parseKp', () => {
  // ── primary (array-of-objects, field: "Kp") ───────────────────────────────
  // Matches: /products/noaa-planetary-k-index.json

  // Primary uses header + array-rows format:
  // [["time_tag","Kp","Kp_index","station_count"], ["2024-01-01 00:00:00","2.33","2.67",13], ...]

  describe('primary source', () => {
    it('returns the last valid Kp reading', () => {
      const data = [
        ['time_tag', 'Kp', 'Kp_index', 'station_count'],
        ['2024-01-01 00:00:00', '2.33', '2.67', 13],
        ['2024-01-01 03:00:00', '3.67', '3.33', 13],
        ['2024-01-01 06:00:00', '4', '4.33', 13],
      ];

      const result = parseKp(data, 'primary');

      expect(result).toEqual<KpReading>({
        time_tag: '2024-01-01 06:00:00',
        kp: 4,
        source: 'primary',
      });
    });

    it('parses Kp values provided as numbers', () => {
      const data = [
        ['time_tag', 'Kp', 'station_count'],
        ['2024-01-01 00:00:00', 3.67, 13],
      ];
      const result = parseKp(data, 'primary');
      expect(result?.kp).toBe(3.67);
      expect(result?.source).toBe('primary');
    });

    it('returns null for empty array', () => {
      expect(parseKp([], 'primary')).toBeNull();
    });

    it('returns null when header row is missing', () => {
      expect(parseKp([null, 42, 'bad'], 'primary')).toBeNull();
    });

    it('returns null when header lacks "Kp" column', () => {
      const data = [
        ['time_tag', 'station_count'],
        ['2024-01-01 00:00:00', 13],
      ];
      expect(parseKp(data, 'primary')).toBeNull();
    });

    it('returns null when all data rows have N/A Kp values', () => {
      const data = [
        ['time_tag', 'Kp', 'station_count'],
        ['2024-01-01 00:00:00', 'N/A', 13],
        ['2024-01-01 03:00:00', 'N/A', 13],
        ['2024-01-01 06:00:00', 'N/A', 13],
      ];
      expect(parseKp(data, 'primary')).toBeNull();
    });

    it('skips data rows with unparseable Kp values (e.g. "N/A")', () => {
      const data = [
        ['time_tag', 'Kp', 'station_count'],
        ['2024-01-01 00:00:00', 'N/A', 13],
        ['2024-01-01 03:00:00', '2', 13],
      ];
      const result = parseKp(data, 'primary');
      expect(result?.kp).toBe(2);
    });

    it('skips Kp values that exceed the valid ceiling of 9', () => {
      const data = [
        ['time_tag', 'Kp', 'station_count'],
        ['2024-01-01 00:00:00', '999', 13],
        ['2024-01-01 03:00:00', '5', 13],
      ];
      const result = parseKp(data, 'primary');
      expect(result?.kp).toBe(5);
    });
  });

  // ── fallback (array-of-objects, field: "kp_index") ────────────────────────
  // Matches: /json/planetary_k_index_1m.json

  describe('fallback source', () => {
    it('returns the last valid Kp reading', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', kp_index: '2.33' },
        { time_tag: '2024-01-01 03:00:00', kp_index: '3.67' },
        { time_tag: '2024-01-01 06:00:00', kp_index: '4' },
      ];

      const result = parseKp(data, 'fallback');

      expect(result).toEqual<KpReading>({
        time_tag: '2024-01-01 06:00:00',
        kp: 4,
        source: 'fallback',
      });
    });

    it('parses kp_index values provided as numbers', () => {
      const data = [{ time_tag: '2024-01-01 00:00:00', kp_index: 3.67 }];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(3.67);
      expect(result?.source).toBe('fallback');
    });

    it('strips "+" suffix: "4+" → 4', () => {
      const data = [{ time_tag: '2024-01-01 00:00:00', kp_index: '4+' }];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(4);
    });

    it('strips "-" suffix: "3-" → 3', () => {
      const data = [{ time_tag: '2024-01-01 00:00:00', kp_index: '3-' }];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(3);
    });

    it('skips rows where kp_index is negative ("-1" sentinel)', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', kp_index: '-1' },
        { time_tag: '2024-01-01 03:00:00', kp_index: '2' },
      ];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(2);
      expect(result?.time_tag).toBe('2024-01-01 03:00:00');
    });

    it('skips rows where kp_index exceeds the valid ceiling of 9', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', kp_index: '999' },
        { time_tag: '2024-01-01 03:00:00', kp_index: '5' },
      ];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(5);
    });

    it('returns null when ALL rows have invalid kp_index values', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', kp_index: '-1' },
        { time_tag: '2024-01-01 03:00:00', kp_index: '-1' },
      ];
      expect(parseKp(data, 'fallback')).toBeNull();
    });

    it('skips items missing the "kp_index" field', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00' }, // missing kp_index
        { time_tag: '2024-01-01 03:00:00', kp_index: 3 },
      ];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(3);
    });

    it('returns null for empty array', () => {
      expect(parseKp([], 'fallback')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(parseKp(null, 'fallback')).toBeNull();
    });
  });

  // ── shared edge cases ──────────────────────────────────────────────────────

  describe('shared edge cases', () => {
    it('returns null for non-array input regardless of source', () => {
      expect(parseKp('bad', 'primary')).toBeNull();
      expect(parseKp(42, 'fallback')).toBeNull();
    });
  });
});
