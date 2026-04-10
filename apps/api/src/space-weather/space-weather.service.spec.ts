import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';

import { SpaceWeatherService } from './space-weather.service';
import { NOAA_CLIENT } from '../infrastructure/clients/client.tokens';
import { INoaaClient } from '../infrastructure/clients/noaa.client';

// ---------------------------------------------------------------------------
// Fixtures — minimal raw data that the parsers accept
// ---------------------------------------------------------------------------

/**
 * Plasma array-of-arrays format accepted by parsePlasma.
 * Column order: time_tag, density, speed, temperature, bt, bx_gse, by_gse, bz_gse, theta_gse, phi_gse
 */
function plasmaRow(
  time_tag: string,
  density: string | 'null',
  speed: string | 'null',
  temperature: string | 'null',
): string[] {
  return [time_tag, density, speed, temperature, '0', '0', '0', '0', '0', '0'];
}

const PLASMA_HEADER = [
  'time_tag', 'density', 'speed', 'temperature',
  'bt', 'bx_gse', 'by_gse', 'bz_gse', 'theta_gse', 'phi_gse',
];

/**
 * Mag array-of-arrays format accepted by parseMag.
 * Only time_tag is needed for the join; other fields can be zero.
 */
function magRow(time_tag: string): string[] {
  return [time_tag, '0', '0', '0', '0', '0', '0', '0', '0', '0'];
}

const MAG_HEADER = [
  'time_tag', 'bx_gse', 'by_gse', 'bz_gse', 'lon_gse', 'lat_gse',
  'bx_gsm', 'by_gsm', 'bz_gsm', 'bt',
];

/** Valid primary Kp payload: array-of-arrays with header row (matches /products/noaa-planetary-k-index.json) */
const PRIMARY_KP_PAYLOAD = [
  ['time_tag', 'Kp', 'station_count'],
  ['2024-01-01 00:00:00', '2.67', 13],
  ['2024-01-01 03:00:00', '3.5', 13],
];

/** Valid fallback Kp payload: array-of-objects with "kp_index" field (matches /json/planetary_k_index_1m.json) */
const FALLBACK_KP_PAYLOAD = [
  { time_tag: '2024-01-01 00:00:00', kp_index: '2' },
  { time_tag: '2024-01-01 00:01:00', kp_index: '4' },
];

/** Empty array — parseKp returns null for both sources */
const EMPTY_KP_PAYLOAD: unknown[] = [];

/** Array where all Kp values are invalid — parseKp('primary') returns null */
const INVALID_KP_PAYLOAD = [
  ['time_tag', 'Kp', 'station_count'],
  ['2024-01-01 00:00:00', '-1', 13], // negative → rejected
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAxiosError(message: string): AxiosError {
  return new AxiosError(message);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('SpaceWeatherService — getSolarWind()', () => {
  let service: SpaceWeatherService;
  let noaaClient: jest.Mocked<INoaaClient>;

  beforeEach(async () => {
    const mockNoaaClient: jest.Mocked<INoaaClient> = {
      getPlasma: jest.fn(),
      getMag: jest.fn(),
      getKpPrimary: jest.fn(),
      getKpFallback: jest.fn(),
      getFlares: jest.fn(),
      getAlerts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceWeatherService,
        { provide: NOAA_CLIENT, useValue: mockNoaaClient },
      ],
    }).compile();

    service = module.get(SpaceWeatherService);
    noaaClient = module.get(NOAA_CLIENT);
  });

  it('sets latest to null when all rows have a null temperature', async () => {
    // speed and density are present but temperature is unavailable
    noaaClient.getPlasma.mockResolvedValue([
      PLASMA_HEADER,
      plasmaRow('2024-01-01 00:00:00', '5.2', '450', 'null'),
      plasmaRow('2024-01-01 00:01:00', '6.0', '460', 'null'),
    ]);
    noaaClient.getMag.mockResolvedValue([
      MAG_HEADER,
      magRow('2024-01-01 00:00:00'),
      magRow('2024-01-01 00:01:00'),
    ]);

    const result = await service.getSolarWind();

    expect(result.latest).toBeNull();
  });

  it('skips rows with null temperature and returns the most recent fully-populated row', async () => {
    // Row at 00:02 has null temperature — latest must be the 00:01 row
    noaaClient.getPlasma.mockResolvedValue([
      PLASMA_HEADER,
      plasmaRow('2024-01-01 00:00:00', '5.0', '440', '75000'),
      plasmaRow('2024-01-01 00:01:00', '5.5', '450', '80000'),
      plasmaRow('2024-01-01 00:02:00', '6.0', '460', 'null'),
    ]);
    noaaClient.getMag.mockResolvedValue([
      MAG_HEADER,
      magRow('2024-01-01 00:00:00'),
      magRow('2024-01-01 00:01:00'),
      magRow('2024-01-01 00:02:00'),
    ]);

    const result = await service.getSolarWind();

    expect(result.latest).not.toBeNull();
    expect(result.latest!.time_tag).toBe('2024-01-01 00:01:00');
    expect(result.latest!.temperature).toBe(80000);
  });

  it('returns latest when the most recent row has all three values populated', async () => {
    noaaClient.getPlasma.mockResolvedValue([
      PLASMA_HEADER,
      plasmaRow('2024-01-01 00:00:00', '5.0', '440', '75000'),
      plasmaRow('2024-01-01 00:01:00', '5.5', '450', '80000'),
    ]);
    noaaClient.getMag.mockResolvedValue([
      MAG_HEADER,
      magRow('2024-01-01 00:00:00'),
      magRow('2024-01-01 00:01:00'),
    ]);

    const result = await service.getSolarWind();

    expect(result.latest!.time_tag).toBe('2024-01-01 00:01:00');
    expect(result.latest!.speed).toBe(450);
    expect(result.latest!.density).toBe(5.5);
    expect(result.latest!.temperature).toBe(80000);
  });

  it('sets latest to null when the plasma-mag join produces no corroborated rows', async () => {
    // Timestamps don't overlap → join is empty
    noaaClient.getPlasma.mockResolvedValue([
      PLASMA_HEADER,
      plasmaRow('2024-01-01 00:00:00', '5.0', '440', '75000'),
    ]);
    noaaClient.getMag.mockResolvedValue([
      MAG_HEADER,
      magRow('2024-01-01 00:01:00'), // different timestamp
    ]);

    const result = await service.getSolarWind();

    expect(result.latest).toBeNull();
    expect(result.data).toHaveLength(0);
  });

  it('throws HttpException 503 when the NOAA fetch fails', async () => {
    noaaClient.getPlasma.mockRejectedValue(new Error('network'));

    const err = await service.getSolarWind().catch((e) => e);
    expect(err).toBeInstanceOf(HttpException);
    expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(err.getResponse()).toMatchObject({ error: expect.any(String), source: expect.any(String), timestamp: expect.any(String) });
  });
});

describe('SpaceWeatherService — getKp()', () => {
  let service: SpaceWeatherService;
  let noaaClient: jest.Mocked<INoaaClient>;

  beforeEach(async () => {
    const mockNoaaClient: jest.Mocked<INoaaClient> = {
      getPlasma: jest.fn(),
      getMag: jest.fn(),
      getKpPrimary: jest.fn(),
      getKpFallback: jest.fn(),
      getFlares: jest.fn(),
      getAlerts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceWeatherService,
        { provide: NOAA_CLIENT, useValue: mockNoaaClient },
      ],
    }).compile();

    service = module.get(SpaceWeatherService);
    noaaClient = module.get(NOAA_CLIENT);
  });

  // -------------------------------------------------------------------------
  // Happy path — primary succeeds
  // -------------------------------------------------------------------------

  it('uses primary source when primary fetch succeeds', async () => {
    noaaClient.getKpPrimary.mockResolvedValue(PRIMARY_KP_PAYLOAD);

    const result = await service.getKp();

    expect(result.source).toBe('primary');
    expect(result.kp).toBe(3.5);
    expect(noaaClient.getKpFallback).not.toHaveBeenCalled();
  });

  it('attaches a human-readable label for the returned kp value', async () => {
    // kp=3.5 → floor=3 → not in KP_LABEL_MAP → 'Quiet'
    noaaClient.getKpPrimary.mockResolvedValue(PRIMARY_KP_PAYLOAD);

    const result = await service.getKp();

    expect(result.label).toBe('Quiet');
  });

  // -------------------------------------------------------------------------
  // Fallback — primary returns empty/invalid data
  // -------------------------------------------------------------------------

  it('falls through to fallback when primary returns an empty array', async () => {
    noaaClient.getKpPrimary.mockResolvedValue(EMPTY_KP_PAYLOAD);
    noaaClient.getKpFallback.mockResolvedValue(FALLBACK_KP_PAYLOAD);

    const result = await service.getKp();

    expect(noaaClient.getKpFallback).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('fallback');
    expect(result.kp).toBe(4);
  });

  it('falls through to fallback when primary data has no valid kp_index values', async () => {
    noaaClient.getKpPrimary.mockResolvedValue(INVALID_KP_PAYLOAD);
    noaaClient.getKpFallback.mockResolvedValue(FALLBACK_KP_PAYLOAD);

    const result = await service.getKp();

    expect(noaaClient.getKpFallback).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('fallback');
  });

  // -------------------------------------------------------------------------
  // Fallback — primary throws AxiosError (network failure)
  // -------------------------------------------------------------------------

  it('falls through to fallback when primary throws an AxiosError', async () => {
    noaaClient.getKpPrimary.mockRejectedValue(makeAxiosError('Network Error'));
    noaaClient.getKpFallback.mockResolvedValue(FALLBACK_KP_PAYLOAD);

    const result = await service.getKp();

    expect(noaaClient.getKpFallback).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('fallback');
  });

  it('does not call fallback when primary throws a non-network error', async () => {
    const parseError = new TypeError('Unexpected token in parser');
    noaaClient.getKpPrimary.mockRejectedValue(parseError);

    await expect(service.getKp()).rejects.toThrow(TypeError);
    expect(noaaClient.getKpFallback).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Total failure paths
  // -------------------------------------------------------------------------

  it('throws HttpException 503 when both primary (AxiosError) and fallback fail', async () => {
    noaaClient.getKpPrimary.mockRejectedValue(makeAxiosError('timeout'));
    noaaClient.getKpFallback.mockRejectedValue(makeAxiosError('timeout'));

    const err = await service.getKp().catch((e) => e);
    expect(err).toBeInstanceOf(HttpException);
    expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('throws HttpException 503 when primary returns null and fallback returns null', async () => {
    noaaClient.getKpPrimary.mockResolvedValue(EMPTY_KP_PAYLOAD);
    noaaClient.getKpFallback.mockResolvedValue(EMPTY_KP_PAYLOAD);

    const err = await service.getKp().catch((e) => e);
    expect(err).toBeInstanceOf(HttpException);
    expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('attaches kp label G5 for out-of-range kp values (guard test)', async () => {
    // Inject a payload where the kp value is 9 (valid maximum)
    const kp9Payload = [
      ['time_tag', 'Kp', 'station_count'],
      ['2024-01-01 00:00:00', '9', 13],
    ];
    noaaClient.getKpPrimary.mockResolvedValue(kp9Payload);

    const result = await service.getKp();

    expect(result.kp).toBe(9);
    expect(result.label).toBe('G5 – Extreme');
  });
});

// ---------------------------------------------------------------------------
// Fixtures — minimal FlareDto-shaped objects
// ---------------------------------------------------------------------------

function flare(class_letter: string, end_time: string | null) {
  return { begin_time: '2024-01-01T00:00:00Z', peak_time: null, end_time, class_letter, scale: `${class_letter}1.0`, linked_events: null };
}

describe('SpaceWeatherService — getFlares() activeClass', () => {
  let service: SpaceWeatherService;
  let noaaClient: jest.Mocked<INoaaClient>;

  beforeEach(async () => {
    const mockNoaaClient: jest.Mocked<INoaaClient> = {
      getPlasma: jest.fn(),
      getMag: jest.fn(),
      getKpPrimary: jest.fn(),
      getKpFallback: jest.fn(),
      getFlares: jest.fn(),
      getAlerts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceWeatherService,
        { provide: NOAA_CLIENT, useValue: mockNoaaClient },
      ],
    }).compile();

    service = module.get(SpaceWeatherService);
    noaaClient = module.get(NOAA_CLIENT);
  });

  it('returns null activeClass when only ended (historical) flares are present', async () => {
    // X-class flare that has ended — must NOT elevate activeClass
    noaaClient.getFlares.mockResolvedValue([flare('X', '2024-01-01T01:00:00Z')]);

    const result = await service.getFlares();

    expect(result.activeClass).toBeNull();
  });

  it('ignores ended high-class flares and uses the still-active lower-class flare', async () => {
    // Historical X flare (ended) alongside an active M flare — activeClass must be M
    noaaClient.getFlares.mockResolvedValue([
      flare('X', '2024-01-01T01:00:00Z'),
      flare('M', null),
    ]);

    const result = await service.getFlares();

    expect(result.activeClass).toBe('M');
  });

  it('returns the highest class among multiple active flares', async () => {
    noaaClient.getFlares.mockResolvedValue([
      flare('B', null),
      flare('X', null),
      flare('M', null),
    ]);

    const result = await service.getFlares();

    expect(result.activeClass).toBe('X');
  });

  it('returns null activeClass when no flares are present', async () => {
    noaaClient.getFlares.mockResolvedValue([]);

    const result = await service.getFlares();

    expect(result.activeClass).toBeNull();
  });

  it('sorts flares by peak_time descending (most recent first)', async () => {
    // Pass raw objects with explicit peak_time values so parseFlares picks them up.
    // The flare() fixture always sets peak_time: null; we construct these directly.
    noaaClient.getFlares.mockResolvedValue([
      { begin_time: '2024-01-01T00:00:00Z', peak_time: '2024-01-01T01:00:00Z', end_time: '2024-01-01T02:00:00Z', scale: 'C1.0' },
      { begin_time: '2024-01-01T02:30:00Z', peak_time: '2024-01-01T03:00:00Z', end_time: '2024-01-01T04:00:00Z', scale: 'M2.0' },
      { begin_time: '2024-01-01T01:30:00Z', peak_time: '2024-01-01T02:00:00Z', end_time: '2024-01-01T03:00:00Z', scale: 'B5.0' },
    ]);

    const result = await service.getFlares();

    expect(result.flares[0].peak_time).toBe('2024-01-01T03:00:00Z');
    expect(result.flares[1].peak_time).toBe('2024-01-01T02:00:00Z');
    expect(result.flares[2].peak_time).toBe('2024-01-01T01:00:00Z');
  });

  it('floats active flares (no peak_time) to the top of the sorted list', async () => {
    noaaClient.getFlares.mockResolvedValue([
      { begin_time: '2024-01-01T00:00:00Z', peak_time: '2024-01-01T01:00:00Z', end_time: '2024-01-01T02:00:00Z', scale: 'C1.0' },
      { begin_time: '2024-01-01T03:00:00Z', peak_time: null, end_time: null, scale: 'X1.5' },  // active
    ]);

    const result = await service.getFlares();

    expect(result.flares[0].peak_time).toBeNull();  // active flare first
    expect(result.flares[1].peak_time).toBe('2024-01-01T01:00:00Z');
  });
});

describe('SpaceWeatherService — getAlerts()', () => {
  let service: SpaceWeatherService;
  let noaaClient: jest.Mocked<INoaaClient>;

  beforeEach(async () => {
    const mockNoaaClient: jest.Mocked<INoaaClient> = {
      getPlasma: jest.fn(),
      getMag: jest.fn(),
      getKpPrimary: jest.fn(),
      getKpFallback: jest.fn(),
      getFlares: jest.fn(),
      getAlerts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceWeatherService,
        { provide: NOAA_CLIENT, useValue: mockNoaaClient },
      ],
    }).compile();

    service = module.get(SpaceWeatherService);
    noaaClient = module.get(NOAA_CLIENT);
  });

  it('returns empty alerts array (not an error) when NOAA returns no active alerts', async () => {
    noaaClient.getAlerts.mockResolvedValue([]);

    const result = await service.getAlerts();

    expect(result.alerts).toEqual([]);
  });

  it('returns parsed alerts when NOAA returns alert objects', async () => {
    noaaClient.getAlerts.mockResolvedValue([
      { issue_time: '2024-01-01T00:00:00Z', product_id: 'WATA50', message: 'Test alert body' },
      { issue_time: '2024-01-01T01:00:00Z', product_id: 'ALTK04', message: 'Another alert' },
    ]);

    const result = await service.getAlerts();

    expect(result.alerts).toHaveLength(2);
    expect(result.alerts[0].product_id).toBe('WATA50');
    expect(result.alerts[1].product_id).toBe('ALTK04');
  });

  it('throws HttpException 503 when the NOAA fetch fails', async () => {
    noaaClient.getAlerts.mockRejectedValue(new Error('network'));

    const err = await service.getAlerts().catch((e) => e);
    expect(err).toBeInstanceOf(HttpException);
    expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });
});
