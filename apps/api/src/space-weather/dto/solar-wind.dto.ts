import { ApiProperty } from '@nestjs/swagger';
import { SolarWind } from '@repo/shared';

export class SolarWindReadingDto implements SolarWind {
  @ApiProperty({
    description: 'ISO 8601 timestamp of the reading from the DSCOVR satellite',
    example: '2024-03-15T12:00:00Z',
  })
  time_tag: string;

  @ApiProperty({
    description: 'Solar wind bulk speed in km/s',
    example: 450.3,
    nullable: true,
    required: false,
    type: Number,
  })
  speed: number | null;

  @ApiProperty({
    description: 'Solar wind proton density in particles per cubic centimetre (p/cc)',
    example: 5.2,
    nullable: true,
    required: false,
    type: Number,
  })
  density: number | null;

  @ApiProperty({
    description: 'Solar wind proton temperature in Kelvin',
    example: 98000,
    nullable: true,
    required: false,
    type: Number,
  })
  temperature: number | null;

  @ApiProperty({
    description: 'Interplanetary magnetic field Bz component in the GSM frame, in nanotesla (nT). Negative values indicate southward orientation, which drives geomagnetic storms.',
    example: -5.2,
    nullable: true,
    required: false,
    type: Number,
  })
  bz: number | null;
}

export class SolarWindResponseDto {
  @ApiProperty({
    description: 'Full time-series of solar wind readings from the current fetch window',
    type: SolarWindReadingDto,
    isArray: true,
  })
  data: SolarWindReadingDto[];

  @ApiProperty({
    description: 'Most recent reading with all non-null values; null when no valid reading exists',
    type: SolarWindReadingDto,
    nullable: true,
    required: false,
  })
  latest: SolarWindReadingDto | null;

}
