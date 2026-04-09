import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppCacheModule } from "./cache/cache.module";
import { SpaceWeatherModule } from "./space-weather/space-weather.module";
import { GeocodeModule } from "./geocode/geocode.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppCacheModule,
    SpaceWeatherModule,
    GeocodeModule,
  ],
})
export class AppModule {}
