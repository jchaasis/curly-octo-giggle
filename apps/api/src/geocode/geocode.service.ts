import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { NOMINATIM_CLIENT } from '../infrastructure/clients/client.tokens';
import { INominatimClient } from '../infrastructure/clients/nominatim.client';
import { GeoResultDto } from './dto/geocode.dto';

// Maximum query length forwarded to Nominatim — prevents excessively long URLs
// and strips any control characters that could alter the HTTP request.
const MAX_QUERY_LENGTH = 200;

function sanitize(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // strip control characters
    .slice(0, MAX_QUERY_LENGTH);
}

function toGeoResultDto(result: {
  lat: string;
  lon: string;
  display_name: string;
}): GeoResultDto {
  return {
    // Nominatim display_name is typically "City, Region, Country".
    // We take the first segment as the city name.
    city: result.display_name.split(',')[0].trim(),
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    displayName: result.display_name,
  };
}

@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  constructor(
    @Inject(NOMINATIM_CLIENT) private readonly nominatim: INominatimClient,
  ) {}

  async search(q: string): Promise<GeoResultDto[]> {
    const sanitized = sanitize(q);

    if (!sanitized) {
      return [];
    }

    let results: Awaited<ReturnType<typeof this.nominatim.search>>;
    try {
      results = await this.nominatim.search(sanitized);
    } catch {
      throw new HttpException(
        { error: 'Geocoding service unavailable', timestamp: new Date().toISOString() },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (results.length === 0) {
      this.logger.warn(`No geocoding results for query "${sanitized}"`);
    }

    return results.map(toGeoResultDto);
  }

  async reverse(lat: number, lon: number): Promise<GeoResultDto> {
    let result: Awaited<ReturnType<typeof this.nominatim.reverse>>;
    try {
      result = await this.nominatim.reverse(lat, lon);
    } catch {
      throw new HttpException(
        { error: 'Geocoding service unavailable', timestamp: new Date().toISOString() },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!result) {
      throw new HttpException(
        { error: `No location found for coordinates ${lat},${lon}`, timestamp: new Date().toISOString() },
        HttpStatus.NOT_FOUND,
      );
    }

    return toGeoResultDto(result);
  }
}
