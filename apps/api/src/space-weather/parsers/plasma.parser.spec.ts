import { parsePlasma } from './plasma.parser';
import { SolarWind } from '@repo/shared';

describe('parsePlasma', () => {
  // ── array-of-arrays ────────────────────────────────────────────────────────

  describe('array-of-arrays format', () => {
    const header = [
      'time_tag',
      'density',
      'speed',
      'temperature',
      'bt',
      'bx_gse',
      'by_gse',
      'bz_gse',
      'theta_gse',
      'phi_gse',
    ];

    it('returns parsed SolarWind records, skipping the header row', () => {
      const data = [
        header,
        ['2024-01-01 00:00:00', '5.2', '450', '80000', '10', '1', '2', '-3', '4', '5'],
        ['2024-01-01 00:01:00', '6.0', '460', '82000', '10', '1', '2', '-3', '4', '5'],
      ];

      const result = parsePlasma(data);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual<SolarWind>({
        time_tag: '2024-01-01 00:00:00',
        density: 5.2,
        speed: 450,
        temperature: 80000,
        bz: null,
      });
      expect(result[1]).toEqual<SolarWind>({
        time_tag: '2024-01-01 00:01:00',
        density: 6.0,
        speed: 460,
        temperature: 82000,
        bz: null,
      });
    });

    it('returns empty array when only the header row is present', () => {
      expect(parsePlasma([header])).toEqual([]);
    });

    it('skips rows where time_tag is empty', () => {
      const data = [
        header,
        ['', '5.2', '450', '80000', '', '', '', '', '', ''],
        ['2024-01-01 00:01:00', '6.0', '460', '82000', '', '', '', '', '', ''],
      ];
      const result = parsePlasma(data);
      expect(result).toHaveLength(1);
      expect(result[0].time_tag).toBe('2024-01-01 00:01:00');
    });

    it('returns null for unparseable numeric fields (NOAA sentinel values)', () => {
      const data = [
        header,
        ['2024-01-01 00:00:00', 'N/A', 'N/A', 'N/A', '', '', '', '', '', ''],
      ];
      const result = parsePlasma(data);
      expect(result[0]).toEqual<SolarWind>({
        time_tag: '2024-01-01 00:00:00',
        density: null,
        speed: null,
        temperature: null,
        bz: null,
      });
    });
  });

  // ── array-of-objects ───────────────────────────────────────────────────────

  describe('array-of-objects format', () => {
    it('coerces null field values to null (does not skip the row)', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', speed: null, density: null, temperature: null },
      ];
      const result = parsePlasma(data);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual<SolarWind>({
        time_tag: '2024-01-01 00:00:00',
        speed: null,
        density: null,
        temperature: null,
        bz: null,
      });
    });

    it('maps speed→speed, density→density, temperature→temperature (not transposed)', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', speed: '500', density: '7.5', temperature: '100000' },
      ];
      const result = parsePlasma(data);
      expect(result[0].speed).toBe(500);
      expect(result[0].density).toBe(7.5);
      expect(result[0].temperature).toBe(100000);
    });

    it('parses objects with string numeric values', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', speed: '450', density: '5.2', temperature: '80000' },
        { time_tag: '2024-01-01 00:01:00', speed: '460', density: '6.0', temperature: '82000' },
      ];

      const result = parsePlasma(data);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual<SolarWind>({
        time_tag: '2024-01-01 00:00:00',
        speed: 450,
        density: 5.2,
        temperature: 80000,
        bz: null,
      });
      expect(result[1]).toEqual<SolarWind>({
        time_tag: '2024-01-01 00:01:00',
        speed: 460,
        density: 6.0,
        temperature: 82000,
        bz: null,
      });
    });

    it('parses objects with numeric values already as numbers', () => {
      const data = [
        { time_tag: '2024-01-01 00:00:00', speed: 450, density: 5.2, temperature: 80000 },
      ];
      const result = parsePlasma(data);
      expect(result[0].speed).toBe(450);
      expect(result[0].density).toBe(5.2);
    });

    it('skips items that are not valid plasma objects (null, numbers, missing fields)', () => {
      const data = [
        null,
        42,
        { time_tag: '2024-01-01 00:00:00', speed: '450' }, // missing density + temperature
        { time_tag: '2024-01-01 00:00:00', speed: '450', density: '5.2', temperature: '80000' },
      ];
      const result = parsePlasma(data);
      expect(result).toHaveLength(1);
      expect(result[0].time_tag).toBe('2024-01-01 00:00:00');
    });

    it('skips items with a missing or non-string time_tag', () => {
      const data = [
        { time_tag: 12345, speed: '450', density: '5.2', temperature: '80000' },
        { speed: '450', density: '5.2', temperature: '80000' }, // no time_tag
        { time_tag: '2024-01-01 00:00:00', speed: '450', density: '5.2', temperature: '80000' },
      ];
      const result = parsePlasma(data);
      expect(result).toHaveLength(1);
      expect(result[0].time_tag).toBe('2024-01-01 00:00:00');
    });
  });

  // ── edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns empty array for empty array input', () => {
      expect(parsePlasma([])).toEqual([]);
    });

    it('returns empty array for null input', () => {
      expect(parsePlasma(null)).toEqual([]);
    });

    it('returns empty array for non-array input', () => {
      expect(parsePlasma('bad')).toEqual([]);
      expect(parsePlasma(42)).toEqual([]);
      expect(parsePlasma({})).toEqual([]);
    });
  });
});
