import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import { SpaceWeatherModule } from "./space-weather/space-weather.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global cache module — registered once here so all feature modules share
    // the same store. Per-call TTLs in each service override this default.
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('CACHE_TTL_DEFAULT', 60_000),
      }),
    }),
    SpaceWeatherModule,
  ],
})
export class AppModule {}
