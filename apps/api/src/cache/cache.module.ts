import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Global cache module — registered once at the app level so all feature modules
 * share the same store. Per-call TTLs in each service override this default.
 */
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('CACHE_TTL_DEFAULT', 60_000),
      }),
    }),
  ],
})
export class AppCacheModule {}
