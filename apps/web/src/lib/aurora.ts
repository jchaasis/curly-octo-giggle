export type AuroraStatus = {
  tier: 0 | 1 | 2 | 3 | 4 | 5;
  label: string;
  progress: number;
};

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
  const kpIndex = Math.min(9, Math.max(0, Math.floor(kp)));
  const threshold = KP_THRESHOLD_LATITUDES[kpIndex];
  const absLatitude = Math.abs(latitude);

  let tier: 0 | 1 | 2 | 3 | 4 | 5;
  let label: string;

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
