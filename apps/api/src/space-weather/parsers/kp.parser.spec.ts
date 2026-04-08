import { parseKp } from './kp.parser';
import { KpReading } from '@repo/shared';

describe('parseKp', () => {
  // ── primary (array-of-objects) ─────────────────────────────────────────────

  describe('primary source', () => {
    it('returns the last valid Kp reading', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', kp_index: '2.33' },
        { time_tag: '2024-01-01 03:00:00', kp_index: '3.67' },
        { time_tag: '2024-01-01 06:00:00', kp_index: '4' },
      ];

      const result = parseKp(data, 'primary');

      expect(result).toEqual<KpReading>({
        time_tag: '2024-01-01 06:00:00',
        kp: 4,
        source: 'primary',
      });
    });

    it('parses kp_index values provided as numbers', () => {
      const data = [{ time_tag: '2024-01-01 00:00:00', kp_index: 3.67 }];
      const result = parseKp(data, 'primary');
      expect(result?.kp).toBe(3.67);
      expect(result?.source).toBe('primary');
    });

    it('returns null for empty array', () => {
      expect(parseKp([], 'primary')).toBeNull();
    });

    it('returns null when no valid objects are present', () => {
      expect(parseKp([null, 42, 'bad'], 'primary')).toBeNull();
    });

    it('skips items missing required fields and returns correct kp + source', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00' }, // missing kp_index
        { time_tag: '2024-01-01 03:00:00', kp_index: '3' },
      ];
      const result = parseKp(data, 'primary');
      expect(result?.time_tag).toBe('2024-01-01 03:00:00');
      expect(result?.kp).toBe(3);
      expect(result?.source).toBe('primary');
    });

    it('skips kp_index values that are unparseable (e.g. "N/A")', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', kp_index: 'N/A' },
        { time_tag: '2024-01-01 03:00:00', kp_index: '2' },
      ];
      const result = parseKp(data, 'primary');
      expect(result?.kp).toBe(2);
    });
  });

  // ── fallback (array-of-arrays) ─────────────────────────────────────────────

  describe('fallback source', () => {
    it('returns the last valid Kp reading, finding column by header name', () => {
      const data = [
        ['time_tag', 'Kp', 'ap'],
        ['2024-01-01 00:00:00', '2.33', '12'],
        ['2024-01-01 03:00:00', '3.67', '20'],
        ['2024-01-01 06:00:00', '4', '27'],
      ];

      const result = parseKp(data, 'fallback');

      expect(result).toEqual<KpReading>({
        time_tag: '2024-01-01 06:00:00',
        kp: 4,
        source: 'fallback',
      });
    });

    it('strips "+" suffix: "4+" → 4', () => {
      const data = [['time_tag', 'Kp'], ['2024-01-01 00:00:00', '4+']];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(4);
    });

    it('strips "-" suffix: "3-" → 3', () => {
      const data = [['time_tag', 'Kp'], ['2024-01-01 00:00:00', '3-']];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(3);
    });

    it('skips rows where parsed Kp is negative (n < 0 guard rejects "-1" sentinel and any negative)', () => {
      const data = [
        ['time_tag', 'Kp'],
        ['2024-01-01 00:00:00', '-1'],
        ['2024-01-01 03:00:00', '2'],
      ];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(2);
      expect(result?.time_tag).toBe('2024-01-01 03:00:00');
    });

    it('skips rows where Kp exceeds the valid ceiling of 9', () => {
      const data = [
        ['time_tag', 'Kp'],
        ['2024-01-01 00:00:00', '999'],
        ['2024-01-01 03:00:00', '5'],
      ];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(5);
    });

    it('returns null when ALL rows have invalid Kp values', () => {
      const data = [
        ['time_tag', 'Kp'],
        ['2024-01-01 00:00:00', '-1'],
        ['2024-01-01 03:00:00', '-1'],
      ];
      expect(parseKp(data, 'fallback')).toBeNull();
    });

    it('finds the Kp column by name even when it is not at index 1', () => {
      const data = [
        ['time_tag', 'ap', 'Kp', 'extra'],
        ['2024-01-01 00:00:00', '12', '3.33', 'x'],
      ];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(3.33);
    });

    it('finds the Kp column when header has trailing whitespace ("Kp ")', () => {
      const data = [
        ['time_tag', 'Kp '],
        ['2024-01-01 00:00:00', '3'],
      ];
      const result = parseKp(data, 'fallback');
      expect(result?.kp).toBe(3);
    });

    it('returns null when the header row has no "Kp" column', () => {
      const data = [['time_tag', 'ap'], ['2024-01-01 00:00:00', '12']];
      expect(parseKp(data, 'fallback')).toBeNull();
    });

    it('returns null for empty array', () => {
      expect(parseKp([], 'fallback')).toBeNull();
    });

    it('returns null when first element is not an array', () => {
      const data = [{ time_tag: '2024-01-01', kp_index: 3 }];
      expect(parseKp(data, 'fallback')).toBeNull();
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
