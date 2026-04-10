import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
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
  ) {}

  async getSolarWind(): Promise<SolarWindResponseDto> {
    let plasmaRaw: unknown;
    let magRaw: unknown;

    try {
      [plasmaRaw, magRaw] = await Promise.all([
        this.noaaClient.getPlasma(),
        this.noaaClient.getMag(),
      ]);
    } catch (err) {
      throw new HttpException(
        { error: 'Solar wind data unavailable', source: 'NOAA DSCOVR', timestamp: new Date().toISOString() },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
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
    };

    return result;
  }

  async getKp(): Promise<KpResponseDto> {
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
        throw new HttpException(
          { error: 'Kp index unavailable from all sources', source: 'NOAA Kp', timestamp: new Date().toISOString() },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    if (reading === null) {
      throw new HttpException(
        { error: 'Kp index unavailable from all sources', source: 'NOAA Kp', timestamp: new Date().toISOString() },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const result: KpResponseDto = {
      kp: reading.kp,
      label: kpLabel(reading.kp),
      source: reading.source,
      time_tag: reading.time_tag,
    };

    return result;
  }

  async getFlares(): Promise<FlaresResponseDto> {
    let raw: unknown;
    try {
      raw = await this.noaaClient.getFlares();
    } catch {
      throw new HttpException(
        { error: 'Flares data unavailable', source: 'NOAA SWPC', timestamp: new Date().toISOString() },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
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
    };

    return result;
  }

  async getAlerts(): Promise<AlertsResponseDto> {
    let raw: unknown;
    try {
      raw = await this.noaaClient.getAlerts();
    } catch {
      throw new HttpException(
        { error: 'Alerts data unavailable', source: 'NOAA SWPC', timestamp: new Date().toISOString() },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const alerts = parseAlerts(raw);

    const result: AlertsResponseDto = {
      alerts,
    };

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
