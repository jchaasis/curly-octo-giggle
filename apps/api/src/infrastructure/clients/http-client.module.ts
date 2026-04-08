import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import {
  AXIOS_NOAA,
  AXIOS_NOMINATIM,
  NOAA_CLIENT,
  NOMINATIM_CLIENT,
} from "./client.tokens";
import { NoaaClient } from "./noaa.client";
import { NominatimClient } from "./nominatim.client";

const MAX_RETRIES = 2; // 1 original attempt + 2 retries = 3 total

function createAxiosInstance(
  baseURL: string,
  extraHeaders: Record<string, string> = {},
): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 10_000,
    headers: extraHeaders,
  });

  instance.interceptors.response.use(
    (res) => res,
    async (err) => {
      const config = err.config as typeof err.config & {
        _retryCount?: number;
      };
      const status = err.response?.status as number | undefined;
      const isRetriable = !status || status === 429 || status >= 500;

      if (!config || !isRetriable || (config._retryCount ?? 0) >= MAX_RETRIES) {
        return Promise.reject(err);
      }

      config._retryCount = (config._retryCount ?? 0) + 1;
      await new Promise((resolve) =>
        setTimeout(resolve, 300 * config._retryCount),
      );
      return instance(config);
    },
  );

  return instance;
}

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AXIOS_NOAA,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createAxiosInstance(
          config.get<string>("NOAA_BASE_URL", "https://services.swpc.noaa.gov"),
        ),
    },
    {
      provide: AXIOS_NOMINATIM,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createAxiosInstance(
          config.get<string>(
            "NOMINATIM_BASE_URL",
            "https://nominatim.openstreetmap.org",
          ),
          {
            "User-Agent": "SOLARIS-SpaceWeather/1.0",
            "Accept-Language": "en",
          },
        ),
    },
    {
      provide: NOAA_CLIENT,
      inject: [AXIOS_NOAA],
      useFactory: (http: AxiosInstance) => new NoaaClient(http),
    },
    {
      provide: NOMINATIM_CLIENT,
      inject: [AXIOS_NOMINATIM],
      useFactory: (http: AxiosInstance) => new NominatimClient(http),
    },
  ],
  exports: [NOAA_CLIENT, NOMINATIM_CLIENT],
})
export class HttpClientModule {}
