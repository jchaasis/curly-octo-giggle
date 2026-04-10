import { vi, type Mocked } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GeocodeService } from './geocode.service';
import { NOMINATIM_CLIENT } from '../infrastructure/clients/client.tokens';
import { INominatimClient } from '../infrastructure/clients/nominatim.client';

// Minimal geocoding result fixture
function geoResult(city: string) {
  return {
    lat: '40.7128',
    lon: '-74.0060',
    display_name: `${city}, New York, United States`,
  };
}

describe('GeocodeService — search()', () => {
  let service: GeocodeService;
  let nominatim: Mocked<INominatimClient>;

  beforeEach(async () => {
    const mockNominatim: Mocked<INominatimClient> = {
      search: vi.fn(),
      reverse: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodeService,
        { provide: NOMINATIM_CLIENT, useValue: mockNominatim },
      ],
    }).compile();

    service = module.get(GeocodeService);
    nominatim = module.get(NOMINATIM_CLIENT);
  });

  // ---------------------------------------------------------------------------
  // Input sanitization
  // ---------------------------------------------------------------------------

  it('trims leading/trailing whitespace before passing to Nominatim', async () => {
    nominatim.search.mockResolvedValue([geoResult('New York')]);

    await service.search('  New York  ');

    expect(nominatim.search).toHaveBeenCalledWith('New York');
  });

  it('strips control characters before passing to Nominatim', async () => {
    nominatim.search.mockResolvedValue([geoResult('Austin')]);

    await service.search('Austin\x00\x1F\x7F');

    expect(nominatim.search).toHaveBeenCalledWith('Austin');
  });

  it('truncates queries longer than 200 characters', async () => {
    nominatim.search.mockResolvedValue([geoResult('Somewhere')]);
    const longQuery = 'A'.repeat(250);

    await service.search(longQuery);

    const forwarded = nominatim.search.mock.calls[0][0] as string;
    expect(forwarded.length).toBe(200);
  });

  it('returns empty array and does NOT call Nominatim when query is blank after sanitization', async () => {
    const result = await service.search('   \x00\x1F   ');

    expect(result).toEqual([]);
    expect(nominatim.search).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Response mapping
  // ---------------------------------------------------------------------------

  it('maps Nominatim display_name first segment to city field', async () => {
    nominatim.search.mockResolvedValue([geoResult('Brooklyn')]);

    const results = await service.search('Brooklyn');

    expect(results[0].city).toBe('Brooklyn');
    expect(results[0].lat).toBe(40.7128);
    expect(results[0].lon).toBe(-74.006);
  });

  it('returns multiple results when Nominatim returns multiple matches', async () => {
    nominatim.search.mockResolvedValue([
      geoResult('Springfield'),
      geoResult('Springfield Township'),
    ]);

    const results = await service.search('Springfield');

    expect(results).toHaveLength(2);
  });

  it('does not throw HttpException 404 when Nominatim returns no matches', async () => {
    nominatim.search.mockResolvedValue([]);

    const results = await service.search('xkzqjwpv');
    expect(results).toEqual([]);

  });

  it('throws HttpException 503 on Nominatim network failure', async () => {
    nominatim.search.mockRejectedValue(new Error('Network timeout'));

    const err = await service.search('Paris').catch((e) => e);
    expect(err).toBeInstanceOf(HttpException);
    expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });
});

describe('GeocodeService — reverse()', () => {
  let service: GeocodeService;
  let nominatim: Mocked<INominatimClient>;

  beforeEach(async () => {
    const mockNominatim: Mocked<INominatimClient> = {
      search: vi.fn(),
      reverse: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodeService,
        { provide: NOMINATIM_CLIENT, useValue: mockNominatim },
      ],
    }).compile();

    service = module.get(GeocodeService);
    nominatim = module.get(NOMINATIM_CLIENT);
  });

  it('does not throw HttpException 404 when Nominatim returns null (no result for coordinates)', async () => {
    nominatim.reverse.mockResolvedValue(null);

    const result = await service.reverse(0, 0).catch((e) => e);
    expect(result).toEqual(null);
  });

  it('throws HttpException 503 on Nominatim network failure', async () => {
    nominatim.reverse.mockRejectedValue(new Error('timeout'));

    const err = await service.reverse(10, 20).catch((e) => e);
    expect(err).toBeInstanceOf(HttpException);
    expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('maps the Nominatim result to a GeoResultDto', async () => {
    nominatim.reverse.mockResolvedValue({
      lat: '37.7749',
      lon: '-122.4194',
      display_name: 'San Francisco, San Francisco County, California, United States',
    });

    const result = await service.reverse(37.7749, -122.4194);

    expect(result.city).toBe('San Francisco');
    expect(result.lat).toBe(37.7749);
    expect(result.lon).toBe(-122.4194);
  });

  it('never calls the search method (wrong operation)', async () => {
    nominatim.reverse.mockResolvedValue({
      lat: '10', lon: '20', display_name: 'Somewhere, Country',
    });

    await service.reverse(10, 20);

    expect(nominatim.search).not.toHaveBeenCalled();
  });
});
