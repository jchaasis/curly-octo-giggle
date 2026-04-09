import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GeocodeService } from './geocode.service';
import { GeoResultDto } from './dto/geocode.dto';

@ApiTags('geocode')
@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get('search')
  @ApiOperation({ summary: 'Forward geocode a place name or address' })
  @ApiQuery({ name: 'q', description: 'Place name or address to search', example: 'New York' })
  @ApiResponse({ status: 200, type: GeoResultDto, isArray: true, description: 'Matching locations (up to 5)' })
  @ApiResponse({ status: 400, description: 'Missing or empty query parameter' })
  @ApiResponse({ status: 503, description: 'Geocoding service unavailable' })
  async search(@Query('q') q: string): Promise<GeoResultDto[]> {
    if (!q || !q.trim()) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    return this.geocodeService.search(q);
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Reverse geocode coordinates to a place name' })
  @ApiQuery({ name: 'lat', description: 'Latitude in decimal degrees', example: 40.7128 })
  @ApiQuery({ name: 'lon', description: 'Longitude in decimal degrees', example: -74.006 })
  @ApiResponse({ status: 200, type: GeoResultDto, description: 'Resolved location for the given coordinates' })
  @ApiResponse({ status: 400, description: 'Missing or invalid lat/lon parameters' })
  @ApiResponse({ status: 503, description: 'Geocoding service unavailable' })
  async reverse(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ): Promise<GeoResultDto> {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      throw new BadRequestException('Query parameters "lat" and "lon" must be valid numbers');
    }

    return this.geocodeService.reverse(latNum, lonNum);
  }
}
