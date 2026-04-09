import { Module } from '@nestjs/common';
import { HttpClientModule } from '../infrastructure/clients/http-client.module';
import { SpaceWeatherController } from './space-weather.controller';
import { SpaceWeatherService } from './space-weather.service';

// CacheModule is registered globally in AppModule — no local import needed.
@Module({
  imports: [HttpClientModule],
  controllers: [SpaceWeatherController],
  providers: [SpaceWeatherService],
  exports: [SpaceWeatherService],
})
export class SpaceWeatherModule {}
