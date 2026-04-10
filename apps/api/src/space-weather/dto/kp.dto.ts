import { ApiProperty } from '@nestjs/swagger';

// KpResponseDto is a response envelope — it contains all KpReading fields plus
// `label`. It intentionally does not `implements KpReading` because
// the interface may gain required fields that don't belong on an envelope DTO.
export class KpResponseDto {
  @ApiProperty({
    description: 'Numeric Kp index value on the 0–9 scale',
    example: 6,
    minimum: 0,
    maximum: 9,
  })
  kp: number;

  @ApiProperty({
    description:
      'Human-readable geomagnetic storm label. Kp ≥ 5 maps to the G-scale (Kp5=G1 Minor, Kp6=G2 Moderate, Kp7=G3 Strong, Kp8=G4 Severe, Kp9=G5 Extreme). Values below Kp5 are labelled "Quiet".',
    example: 'G2 – Moderate',
  })
  label: string;

  @ApiProperty({
    description: 'Data origin — "primary" when sourced from the real-time NOAA feed, "fallback" when using the estimated planetary K-index',
    example: 'primary',
    enum: ['primary', 'fallback'],
  })
  source: 'primary' | 'fallback';

  @ApiProperty({
    description: 'ISO 8601 timestamp of the Kp reading',
    example: '2024-03-15T12:00:00Z',
  })
  time_tag: string;

}
