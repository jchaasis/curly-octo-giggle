import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AxiosError } from 'axios';

import { SpaceWeatherService } from './space-weather.service';
import { NOAA_CLIENT } from '../infrastructure/clients/client.tokens';
import { INoaaClient } from '../infrastructure/clients/noaa.client';

// ---------------------------------------------------------------------------
// Fixtures — minimal raw data that the parsers accept
// ---------------------------------------------------------------------------

/** Valid primary Kp payload: array-of-objects with "Kp" field (matches /products/noaa-planetary-k-index.json) */
const PRIMARY_KP_PAYLOAD = [
  { time_tag: '2024-01-01 00:00:00', Kp: 2.67 },
  { time_tag: '2024-01-01 03:00:00', Kp: 3.5 },
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
  { time_tag: '2024-01-01 00:00:00', Kp: -1 }, // negative → rejected
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

describe('SpaceWeatherService — getKp()', () => {
  let service: SpaceWeatherService;
  let noaaClient: jest.Mocked<INoaaClient>;
  let cacheGet: jest.Mock;
  let cacheSet: jest.Mock;

  beforeEach(async () => {
    cacheGet = jest.fn().mockResolvedValue(undefined); // always a cache miss
    cacheSet = jest.fn().mockResolvedValue(undefined);

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
        { provide: CACHE_MANAGER, useValue: { get: cacheGet, set: cacheSet } },
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

  it('sets the cache after a successful fetch', async () => {
    noaaClient.getKpPrimary.mockResolvedValue(PRIMARY_KP_PAYLOAD);

    await service.getKp();

    expect(cacheSet).toHaveBeenCalledTimes(1);
    const [key, value, ttl] = cacheSet.mock.calls[0];
    expect(key).toBe('space-weather:kp');
    expect(value).toMatchObject({ source: 'primary', kp: 3.5 });
    expect(typeof ttl).toBe('number');
    expect(ttl).toBeGreaterThan(0);
  });

  it('returns cached value without calling NOAA when cache hits', async () => {
    const cachedPayload = { kp: 2, label: 'Quiet', source: 'primary', time_tag: '2024-01-01', cachedAt: 'ts' };
    cacheGet.mockResolvedValueOnce(cachedPayload);

    const result = await service.getKp();

    expect(result).toEqual(cachedPayload);
    expect(noaaClient.getKpPrimary).not.toHaveBeenCalled();
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

  it('throws ServiceUnavailableException when both primary (AxiosError) and fallback fail', async () => {
    noaaClient.getKpPrimary.mockRejectedValue(makeAxiosError('timeout'));
    noaaClient.getKpFallback.mockRejectedValue(makeAxiosError('timeout'));

    await expect(service.getKp()).rejects.toThrow(ServiceUnavailableException);
  });

  it('throws ServiceUnavailableException when primary returns null and fallback returns null', async () => {
    noaaClient.getKpPrimary.mockResolvedValue(EMPTY_KP_PAYLOAD);
    // Fallback payload also empty → parseKp returns null
    noaaClient.getKpFallback.mockResolvedValue(EMPTY_KP_PAYLOAD);

    await expect(service.getKp()).rejects.toThrow(ServiceUnavailableException);
  });

  it('attaches kp label G5 for out-of-range kp values (guard test)', async () => {
    // Inject a payload where the kp value is 9 (valid maximum)
    const kp9Payload = [{ time_tag: '2024-01-01 00:00:00', Kp: 9 }];
    noaaClient.getKpPrimary.mockResolvedValue(kp9Payload);

    const result = await service.getKp();

    expect(result.kp).toBe(9);
    expect(result.label).toBe('G5 – Extreme');
  });
});
