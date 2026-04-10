export type AuroraStatus = {
  tier: 0 | 1 | 2 | 3 | 4 | 5;
  label: string;
  progress: number;
};

// Equatorward latitude boundary of the auroral oval for each integer Kp level.
// Higher Kp pushes the oval toward the equator, making aurora visible at lower latitudes.
// Source: NOAA/SWPC auroral oval model — https://www.swpc.noaa.gov/content/tips-viewing-aurora
const KP_THRESHOLD_LATITUDES: Record<number, number> = {
  0: 66,
  1: 64,
  2: 62,
  3: 60,
  4: 58,
  5: 55,
  6: 50,
  7: 45,
  8: 40,
  9: 35,
};

// TODO: this should come from an API route
// Keeping here for the MVP, but will want to revisit
export function getAuroraStatus(kp: number, latitude: number): AuroraStatus {
  // Clamp and floor to valid integer Kp so it maps to KP_THRESHOLD_LATITUDES.
  const kpIndex = Math.min(9, Math.max(0, Math.floor(kp)));
  const threshold = KP_THRESHOLD_LATITUDES[kpIndex];
  // Use absolute latitude so the same logic applies to both hemispheres.
  const absLatitude = Math.abs(latitude);

  let tier: 0 | 1 | 2 | 3 | 4 | 5;
  let label: string;

  // Tiers are bands relative to the threshold latitude:
  //   ≥ threshold + 10° → deep inside the oval  → Highly Likely (tier 5)
  //   ≥ threshold + 5°  → well inside the oval   → Very Likely   (tier 4)
  //   ≥ threshold       → at the oval boundary   → Likely         (tier 3)
  //   ≥ threshold - 5°  → just outside the oval  → Possible       (tier 2)
  //   ≥ threshold - 10° → well outside the oval  → Unlikely       (tier 1)
  //   < threshold - 10° → far from the oval      → Not Visible    (tier 0)
  if (absLatitude >= threshold + 10) {
    tier = 5;
    label = 'Highly Likely';
  } else if (absLatitude >= threshold + 5) {
    tier = 4;
    label = 'Very Likely';
  } else if (absLatitude >= threshold) {
    tier = 3;
    label = 'Likely';
  } else if (absLatitude >= threshold - 5) {
    tier = 2;
    label = 'Possible';
  } else if (absLatitude >= threshold - 10) {
    tier = 1;
    label = 'Unlikely';
  } else {
    tier = 0;
    label = 'Not Visible';
  }

  return {
    tier,
    label,
    progress: tier / 5,
  };
}
