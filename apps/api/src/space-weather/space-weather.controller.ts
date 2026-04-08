import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SpaceWeatherService } from './space-weather.service';
import { SolarWindResponseDto } from './dto/solar-wind.dto';
import { KpResponseDto } from './dto/kp.dto';
import { FlaresResponseDto } from './dto/flares.dto';
import { AlertsResponseDto } from './dto/alerts.dto';

@ApiTags('space-weather')
@Controller('space-weather')
export class SpaceWeatherController {
  constructor(private readonly spaceWeatherService: SpaceWeatherService) {}

  @Get('solar-wind')
  @ApiOperation({ summary: 'Current solar wind plasma data' })
  @ApiResponse({ status: 200, type: SolarWindResponseDto, description: 'Solar wind plasma time-series with most-recent corroborated reading' })
  @ApiResponse({ status: 503, description: 'Solar wind data unavailable from NOAA' })
  getSolarWind(): Promise<SolarWindResponseDto> {
    return this.spaceWeatherService.getSolarWind();
  }

  @Get('kp')
  @ApiOperation({ summary: 'Current Kp geomagnetic index with G-scale label' })
  @ApiResponse({ status: 200, type: KpResponseDto, description: 'Latest Kp index from primary NOAA feed, or estimated fallback' })
  @ApiResponse({ status: 503, description: 'Kp index unavailable from all sources' })
  getKp(): Promise<KpResponseDto> {
    return this.spaceWeatherService.getKp();
  }

  @Get('flares')
  @ApiOperation({ summary: 'Recent solar flare events' })
  @ApiResponse({ status: 200, type: FlaresResponseDto, description: 'Solar flare events with highest active class letter' })
  @ApiResponse({ status: 503, description: 'Flares data unavailable from NOAA' })
  getFlares(): Promise<FlaresResponseDto> {
    return this.spaceWeatherService.getFlares();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Active NOAA space weather alerts and warnings' })
  @ApiResponse({ status: 200, type: AlertsResponseDto, description: 'Current space weather alerts issued by NOAA SWPC' })
  @ApiResponse({ status: 503, description: 'Alerts data unavailable from NOAA' })
  getAlerts(): Promise<AlertsResponseDto> {
    return this.spaceWeatherService.getAlerts();
  }
}
