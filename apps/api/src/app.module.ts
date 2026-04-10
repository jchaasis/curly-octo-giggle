import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SpaceWeatherModule } from "./space-weather/space-weather.module";
import { GeocodeModule } from "./geocode/geocode.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SpaceWeatherModule,
    GeocodeModule,
  ],
})
export class AppModule {}
