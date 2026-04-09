import { getAuroraStatus } from './aurora';

describe('getAuroraStatus', () => {
  // Kp 5 threshold is 55; used repeatedly in boundary tests
  const KP5_THRESHOLD = 55;

  describe('all 6 tiers', () => {
    // Use Kp 5 (threshold 55) to exercise every tier band cleanly.
    it('tier 0 — Not Visible — lat well below threshold', () => {
      // lat 44 < 45 (55-10), so tier 0
      const result = getAuroraStatus(5, 44);
      expect(result.tier).toBe(0);
      expect(result.label).toBe('Not Visible');
    });

    it('tier 1 — Unlikely — lat within threshold-10 to threshold-5', () => {
      // lat 48: 45 <= 48 < 50 → tier 1
      const result = getAuroraStatus(5, 48);
      expect(result.tier).toBe(1);
      expect(result.label).toBe('Unlikely');
    });

    it('tier 2 — Possible — lat within threshold-5 to threshold', () => {
      // lat 52: 50 <= 52 < 55 → tier 2
      const result = getAuroraStatus(5, 52);
      expect(result.tier).toBe(2);
      expect(result.label).toBe('Possible');
    });

    it('tier 3 — Likely — lat at or just above threshold', () => {
      // lat 57: 55 <= 57 < 60 → tier 3
      const result = getAuroraStatus(5, 57);
      expect(result.tier).toBe(3);
      expect(result.label).toBe('Likely');
    });

    it('tier 4 — Very Likely — lat within threshold+5 to threshold+10', () => {
      // lat 62: 60 <= 62 < 65 → tier 4
      const result = getAuroraStatus(5, 62);
      expect(result.tier).toBe(4);
      expect(result.label).toBe('Very Likely');
    });

    it('tier 5 — Highly Likely — lat at or above threshold+10', () => {
      // lat 67: 67 >= 65 (55+10) → tier 5
      const result = getAuroraStatus(5, 67);
      expect(result.tier).toBe(5);
      expect(result.label).toBe('Highly Likely');
    });
  });

  describe('boundary conditions at Kp 5 (threshold 55)', () => {
    it('lat 55 exactly at threshold → tier 3 (Likely)', () => {
      const result = getAuroraStatus(5, KP5_THRESHOLD);
      expect(result.tier).toBe(3);
      expect(result.label).toBe('Likely');
    });

    it('lat 54 (one below threshold) → tier 2 (Possible) because 54 >= 50', () => {
      const result = getAuroraStatus(5, KP5_THRESHOLD - 1);
      expect(result.tier).toBe(2);
      expect(result.label).toBe('Possible');
    });
  });

  describe('extreme latitudes', () => {
    it('high latitude (90°) with low Kp (0) → tier 5 (threshold 66, 90 >= 76)', () => {
      const result = getAuroraStatus(0, 90);
      expect(result.tier).toBe(5);
      expect(result.label).toBe('Highly Likely');
    });

    it('low latitude (0°) with high Kp (9) → tier 0 (threshold 35, 0 < 25)', () => {
      const result = getAuroraStatus(9, 0);
      expect(result.tier).toBe(0);
      expect(result.label).toBe('Not Visible');
    });
  });

  describe('Kp clamping', () => {
    it('kp -1 is clamped to 0 — no error thrown, threshold equals Kp 0 threshold (66)', () => {
      // Should behave identically to kp 0
      const clamped = getAuroraStatus(-1, 70);
      const unclamped = getAuroraStatus(0, 70);
      expect(clamped).toEqual(unclamped);
    });

    it('kp 10 is clamped to 9 — no error thrown, threshold equals Kp 9 threshold (35)', () => {
      const clamped = getAuroraStatus(10, 40);
      const unclamped = getAuroraStatus(9, 40);
      expect(clamped).toEqual(unclamped);
    });
  });

  describe('fractional Kp', () => {
    it('kp 5.9 floors to 5 — uses threshold 55, not threshold for 6 (50)', () => {
      // At lat 52: with threshold 55, 52 >= 50 → tier 2
      // With threshold 50 (kp 6), 52 >= 50 → tier 3 — different result confirms flooring
      const result = getAuroraStatus(5.9, 52);
      expect(result.tier).toBe(2);
      expect(result.label).toBe('Possible');
    });

    it('kp 2.1 floors to 2 — uses threshold 62', () => {
      // lat 63: 63 >= 62 → tier 3 (Likely)
      const result = getAuroraStatus(2.1, 63);
      expect(result.tier).toBe(3);
      expect(result.label).toBe('Likely');
    });
  });

  describe('progress field', () => {
    it('tier 0 → progress is 0', () => {
      const result = getAuroraStatus(5, 44);
      expect(result.progress).toBe(0 / 5);
    });

    it('tier 1 → progress is 0.2', () => {
      const result = getAuroraStatus(5, 48);
      expect(result.progress).toBe(1 / 5);
    });

    it('tier 2 → progress is 0.4', () => {
      const result = getAuroraStatus(5, 52);
      expect(result.progress).toBe(2 / 5);
    });

    it('tier 3 → progress is 0.6', () => {
      const result = getAuroraStatus(5, 57);
      expect(result.progress).toBe(3 / 5);
    });

    it('tier 4 → progress is 0.8', () => {
      const result = getAuroraStatus(5, 62);
      expect(result.progress).toBe(4 / 5);
    });

    it('tier 5 → progress is 1', () => {
      const result = getAuroraStatus(5, 67);
      expect(result.progress).toBe(5 / 5);
    });
  });

  describe('label strings for all tiers', () => {
    const cases: Array<[number, number, string]> = [
      [5, 44, 'Not Visible'],
      [5, 48, 'Unlikely'],
      [5, 52, 'Possible'],
      [5, 57, 'Likely'],
      [5, 62, 'Very Likely'],
      [5, 67, 'Highly Likely'],
    ];

    it.each(cases)('kp %i, lat %i → label "%s"', (kp, lat, expectedLabel) => {
      expect(getAuroraStatus(kp, lat).label).toBe(expectedLabel);
    });
  });
});
