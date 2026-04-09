import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AxiosError } from 'axios';

import { NOAA_CLIENT } from '../infrastructure/clients/client.tokens';
import { INoaaClient } from '../infrastructure/clients/noaa.client';

import { parsePlasma } from './parsers/plasma.parser';
import { parseMag } from './parsers/mag.parser';
import { parseKp } from './parsers/kp.parser';
import { parseFlares } from './parsers/flares.parser';
import { parseAlerts } from './parsers/alerts.parser';

import { SolarWindReadingDto, SolarWindResponseDto } from './dto/solar-wind.dto';
import { KpResponseDto } from './dto/kp.dto';
import { FlareDto, FlaresResponseDto } from './dto/flares.dto';
import { AlertsResponseDto } from './dto/alerts.dto';

// Per-endpoint cache TTLs in milliseconds (cache-manager v7 uses ms).
const TTL = {
  SOLAR_WIND: 60_000,   // DSCOVR updates ~every minute
  KP: 180_000,          // Kp updates every 3 minutes
  FLARES: 300_000,
  ALERTS: 300_000,
} as const;

const CACHE_KEYS = {
  SOLAR_WIND: 'space-weather:solar-wind',
  KP: 'space-weather:kp',
  FLARES: 'space-weather:flares',
  ALERTS: 'space-weather:alerts',
} as const;

const KP_LABEL_MAP: Record<number, string> = {
  5: 'G1 – Minor',
  6: 'G2 – Moderate',
  7: 'G3 – Strong',
  8: 'G4 – Severe',
  9: 'G5 – Extreme',
};

// Values above 9 are clamped to G5 to guard against any data path that bypasses
// the parser's n > 9 rejection (e.g. mocks, future code paths).
function kpLabel(kp: number): string {
  if (kp > 9) return 'G5 – Extreme';
  const floor = Math.floor(kp);
  return KP_LABEL_MAP[floor] ?? 'Quiet';
}

// GOES X-ray flare classification letters in ascending severity order.
// Unknown letters (e.g. historical 'S' subflares) return -1 from indexOf
// and are intentionally ignored by highestFlareClass.
const FLARE_CLASS_ORDER = ['A', 'B', 'C', 'M', 'X'] as const;

@Injectable()
export class SpaceWeatherService {
  private readonly logger = new Logger(SpaceWeatherService.name);

  constructor(
    @Inject(NOAA_CLIENT) private readonly noaaClient: INoaaClient,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getSolarWind(): Promise<SolarWindResponseDto> {
    const cached = await this.cache.get<SolarWindResponseDto>(CACHE_KEYS.SOLAR_WIND);
    if (cached) return cached;

    let plasmaRaw: unknown;
    let magRaw: unknown;

    try {
      [plasmaRaw, magRaw] = await Promise.all([
        this.noaaClient.getPlasma(),
        this.noaaClient.getMag(),
      ]);
    } catch (err) {
      throw new ServiceUnavailableException('Solar wind data unavailable');
    }

    const plasma = parsePlasma(plasmaRaw);
    const mag = parseMag(magRaw);

    const magTags = new Set(mag.map((r) => r.time_tag));
    const data = plasma.filter((r) => magTags.has(r.time_tag));

    // A non-empty join of two non-empty feeds is the expected case.
    // An empty result here almost always means a timestamp skew between feeds.
    if (data.length === 0 && plasma.length > 0 && mag.length > 0) {
      this.logger.warn(
        `Solar wind join produced no corroborated rows — ` +
          `plasma: ${plasma.length} rows, mag: ${mag.length} rows. ` +
          `Possible timestamp mismatch between NOAA plasma and magnetometer feeds.`,
      );
    }

    // Scan backwards for the most recent entry where all three measurements are
    // non-null. Partial rows (e.g. temperature still pending) are not suitable
    // as an operational "latest" reading because downstream clients display all
    // three values and the DTO contract requires all non-null values.
    let latest: SolarWindReadingDto | null = null;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].speed !== null && data[i].density !== null && data[i].temperature !== null) {
        latest = data[i];
        break;
      }
    }

    const result: SolarWindResponseDto = {
      data,
      latest,
      cachedAt: new Date().toISOString(),
    };

    await this.cache.set(CACHE_KEYS.SOLAR_WIND, result, TTL.SOLAR_WIND);
    return result;
  }

  async getKp(): Promise<KpResponseDto> {
    const cached = await this.cache.get<KpResponseDto>(CACHE_KEYS.KP);
    if (cached) return cached;

    let reading = null;

    try {
      const raw = await this.noaaClient.getKpPrimary();
      reading = parseKp(raw, 'primary');
    } catch (err) {
      if (err instanceof AxiosError) {
        // Network/HTTP failure — fall through to fallback silently.
        this.logger.warn(
          `Kp primary fetch failed (${err.message}), promoting to fallback estimated K-index`,
        );
      } else {
        // Unexpected non-network error (e.g. a bug in parsing logic) — surface it
        // immediately rather than silently masking it behind the fallback.
        throw err;
      }
    }

    if (reading === null) {
      try {
        const raw = await this.noaaClient.getKpFallback();
        reading = parseKp(raw, 'fallback');
      } catch {
        throw new ServiceUnavailableException('Kp index unavailable from all sources');
      }
    }

    if (reading === null) {
      throw new ServiceUnavailableException('Kp index unavailable from all sources');
    }

    const result: KpResponseDto = {
      kp: reading.kp,
      label: kpLabel(reading.kp),
      source: reading.source,
      time_tag: reading.time_tag,
      cachedAt: new Date().toISOString(),
    };

    await this.cache.set(CACHE_KEYS.KP, result, TTL.KP);
    return result;
  }

  async getFlares(): Promise<FlaresResponseDto> {
    const cached = await this.cache.get<FlaresResponseDto>(CACHE_KEYS.FLARES);
    if (cached) return cached;

    let raw: unknown;
    try {
      raw = await this.noaaClient.getFlares();
    } catch {
      throw new ServiceUnavailableException('Flares data unavailable');
    }

    // Sort flares by peak_time descending (most recent first).
    // Flares with no peak_time (still active) float to the top.
    const flares = (parseFlares(raw) as FlareDto[]).sort((a, b) => {
      if (!a.peak_time && !b.peak_time) return 0;
      if (!a.peak_time) return -1;
      if (!b.peak_time) return 1;
      return b.peak_time.localeCompare(a.peak_time);
    });
    const activeClass = this.highestFlareClass(flares);

    const result: FlaresResponseDto = {
      flares,
      activeClass,
      cachedAt: new Date().toISOString(),
    };

    await this.cache.set(CACHE_KEYS.FLARES, result, TTL.FLARES);
    return result;
  }

  async getAlerts(): Promise<AlertsResponseDto> {
    const cached = await this.cache.get<AlertsResponseDto>(CACHE_KEYS.ALERTS);
    if (cached) return cached;

    let raw: unknown;
    try {
      raw = await this.noaaClient.getAlerts();
    } catch {
      throw new ServiceUnavailableException('Alerts data unavailable');
    }

    const alerts = parseAlerts(raw);

    const result: AlertsResponseDto = {
      alerts,
      cachedAt: new Date().toISOString(),
    };

    await this.cache.set(CACHE_KEYS.ALERTS, result, TTL.ALERTS);
    return result;
  }

  private highestFlareClass(flares: FlareDto[]): string | null {
    let highestIndex = -1;

    for (const flare of flares.filter((f) => f.end_time === null)) {
      const idx = FLARE_CLASS_ORDER.indexOf(
        flare.class_letter as (typeof FLARE_CLASS_ORDER)[number],
      );
      if (idx > highestIndex) {
        highestIndex = idx;
      }
    }

    return highestIndex >= 0 ? FLARE_CLASS_ORDER[highestIndex] : null;
  }
}
