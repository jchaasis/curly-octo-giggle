import { ApiProperty } from '@nestjs/swagger';
import { Flare } from '@repo/shared';

export class FlareDto implements Flare {
  @ApiProperty({
    description: 'ISO 8601 timestamp when the flare began',
    example: '2024-03-15T09:30:00Z',
  })
  begin_time: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the flare reached peak intensity; null while flare is still in progress',
    example: '2024-03-15T09:45:00Z',
    nullable: true,
    required: false,
    type: String,
  })
  peak_time: string | null;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the flare ended; null while flare is still in progress',
    example: '2024-03-15T10:00:00Z',
    nullable: true,
    required: false,
    type: String,
  })
  end_time: string | null;

  @ApiProperty({
    description: 'GOES X-ray flare classification letter (A, B, C, M, or X)',
    example: 'M',
  })
  class_letter: string;

  @ApiProperty({
    description: 'Full GOES X-ray flare classification including numeric magnitude (e.g. M3.5)',
    example: 'M3.5',
  })
  scale: string;

  @ApiProperty({
    description: 'NOAA event IDs for space weather events causally linked to this flare (e.g. CMEs, SEPs); null when no linked events are reported',
    example: ['2024-03-15T09:30:00-CME-001'],
    nullable: true,
    required: false,
    type: String,
    isArray: true,
  })
  linked_events: string[] | null;
}

export class FlaresResponseDto {
  @ApiProperty({
    description: 'List of solar flare events reported in the current observation window',
    type: FlareDto,
    isArray: true,
  })
  flares: FlareDto[];

  @ApiProperty({
    description: 'Classification letter of the highest-intensity active flare (e.g. "X", "M"); null when no flares are currently active',
    example: 'M',
    nullable: true,
    required: false,
    type: String,
  })
  activeClass: string | null;

  @ApiProperty({
    description: 'ISO 8601 timestamp recording when this response was last cached',
    example: '2024-03-15T12:05:00Z',
  })
  cachedAt: string;
}
