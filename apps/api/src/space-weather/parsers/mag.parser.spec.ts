import { parseMag } from './mag.parser';
import { MagReading } from '@repo/shared';

describe('parseMag', () => {
  // ── array-of-arrays ────────────────────────────────────────────────────────

  describe('array-of-arrays format', () => {
    // Realistic NOAA magnetometer header — bz_gsm is at index 8.
    const header = [
      'time_tag',
      'bx_gse', 'by_gse', 'bz_gse', 'lon_gse', 'lat_gse',
      'bx_gsm', 'by_gsm', 'bz_gsm', 'bt',
    ];

    it('finds bz_gsm column dynamically and skips the header row', () => {
      const data = [
        header,
        ['2024-01-01 00:00:00', '1', '2', '-5', '10', '20', '0.5', '1.0', '-5.5', '6.1'],
        ['2024-01-01 00:01:00', '1', '2', '-3', '10', '20', '0.3', '0.8', '-3.3', '3.5'],
      ];

      const result = parseMag(data);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual<MagReading>({ time_tag: '2024-01-01 00:00:00', bz: -5.5 });
      expect(result[1]).toEqual<MagReading>({ time_tag: '2024-01-01 00:01:00', bz: -3.3 });
    });

    it('finds bz_gsm regardless of column position', () => {
      // bz_gsm at index 2 — verifies dynamic lookup, not a hardcoded index
      const data = [
        ['time_tag', 'bt', 'bz_gsm'],
        ['2024-01-01 00:00:00', '6.1', '-5.5'],
      ];
      const result = parseMag(data);
      expect(result[0].bz).toBe(-5.5);
    });

    it('returns empty array when only the header row is present', () => {
      expect(parseMag([header])).toEqual([]);
    });

    it('returns empty array when header has no bz_gsm column', () => {
      const data = [
        ['time_tag', 'bz_gse'],
        ['2024-01-01 00:00:00', '-5'],
      ];
      expect(parseMag(data)).toEqual([]);
    });

    it('skips rows with empty time_tag', () => {
      const data = [
        ['time_tag', 'bz_gsm'],
        ['', '-5'],
        ['2024-01-01 00:01:00', '-3'],
      ];
      const result = parseMag(data);
      expect(result).toHaveLength(1);
      expect(result[0].time_tag).toBe('2024-01-01 00:01:00');
    });

    it('returns null for unparseable bz (NOAA sentinel values)', () => {
      const data = [['time_tag', 'bz_gsm'], ['2024-01-01 00:00:00', 'N/A']];
      const result = parseMag(data);
      expect(result[0].bz).toBeNull();
    });
  });

  // ── array-of-objects ───────────────────────────────────────────────────────

  describe('array-of-objects format', () => {
    it('preserves negative Bz values (does not flip sign)', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', bz_gsm: '-12.7' },
        { time_tag: '2024-01-01 00:01:00', bz_gsm: '-0.1' },
      ];
      const result = parseMag(data);
      expect(result[0].bz).toBe(-12.7);
      expect(result[1].bz).toBe(-0.1);
    });

    it('preserves positive Bz values', () => {
      const data = [{ time_tag: '2024-01-01 00:00:00', bz_gsm: '8.4' }];
      const result = parseMag(data);
      expect(result[0].bz).toBe(8.4);
    });

    it('maps bz_gsm field to bz', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', bz_gsm: '-5.5' },
        { time_tag: '2024-01-01 00:01:00', bz_gsm: '-3.3' },
      ];

      const result = parseMag(data);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual<MagReading>({ time_tag: '2024-01-01 00:00:00', bz: -5.5 });
      expect(result[1]).toEqual<MagReading>({ time_tag: '2024-01-01 00:01:00', bz: -3.3 });
    });

    it('parses numeric bz_gsm values', () => {
      const data = [{ time_tag: '2024-01-01 00:00:00', bz_gsm: -5.5 }];
      const result = parseMag(data);
      expect(result[0].bz).toBe(-5.5);
    });

    it('skips items that do not have bz_gsm field', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', bz_gse: '-5' }, // wrong field name
        { time_tag: '2024-01-01 00:01:00', bz_gsm: '-3.3' },
      ];
      const result = parseMag(data);
      expect(result).toHaveLength(1);
      expect(result[0].time_tag).toBe('2024-01-01 00:01:00');
    });

    it('skips items with a missing or non-string time_tag', () => {
      const data = [
        { time_tag: 12345, bz_gsm: '-5' },
        { bz_gsm: '-5' }, // no time_tag
        { time_tag: '2024-01-01 00:00:00', bz_gsm: '-3.3' },
      ];
      const result = parseMag(data);
      expect(result).toHaveLength(1);
      expect(result[0].time_tag).toBe('2024-01-01 00:00:00');
    });
  });

  // ── edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns empty array for empty array input', () => {
      expect(parseMag([])).toEqual([]);
    });

    it('returns empty array for null input', () => {
      expect(parseMag(null)).toEqual([]);
    });

    it('returns empty array for non-array input', () => {
      expect(parseMag('bad')).toEqual([]);
      expect(parseMag(42)).toEqual([]);
    });
  });
});
