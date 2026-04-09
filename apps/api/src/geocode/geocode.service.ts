import { Inject, Injectable, Logger } from '@nestjs/common';
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

    const results = await this.nominatim.search(sanitized);
    return results.map(toGeoResultDto);
  }

  async reverse(lat: number, lon: number): Promise<GeoResultDto | null> {
    const result = await this.nominatim.reverse(lat, lon);

    if (!result) {
      this.logger.warn(`Reverse geocode returned no result for lat=${lat} lon=${lon}`);
      return null;
    }

    return toGeoResultDto(result);
  }
}
