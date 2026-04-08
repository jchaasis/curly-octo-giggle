import { ApiProperty } from '@nestjs/swagger';

// Intentionally uses `lat`/`lon` (matching Nominatim provider output and common
// API convention) rather than `latitude`/`longitude` from the GeoLocation shared
// interface. This DTO is a view model for the geocoding endpoint, not a direct
// mapping of GeoLocation.
export class GeoResultDto {
  @ApiProperty({
    description: 'Resolved city name for the queried location',
    example: 'New York',
  })
  city: string;

  @ApiProperty({
    description: 'Latitude of the location in decimal degrees (WGS 84)',
    example: 40.7128,
    minimum: -90,
    maximum: 90,
  })
  lat: number;

  @ApiProperty({
    description: 'Longitude of the location in decimal degrees (WGS 84)',
    example: -74.006,
    minimum: -180,
    maximum: 180,
  })
  lon: number;

  @ApiProperty({
    description: 'Full human-readable address as returned by the geocoding provider',
    example: 'New York, New York, United States',
  })
  displayName: string;
}
