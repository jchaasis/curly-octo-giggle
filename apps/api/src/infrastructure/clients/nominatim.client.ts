import { Inject, Injectable } from "@nestjs/common";
import { AxiosInstance } from "axios";
import { AXIOS_NOMINATIM } from "./client.tokens";

export interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

export interface INominatimClient {
  search(query: string): Promise<GeocodingResult[]>;
  reverse(lat: number, lon: number): Promise<GeocodingResult | null>;
}

@Injectable()
export class NominatimClient implements INominatimClient {
  constructor(
    @Inject(AXIOS_NOMINATIM) private readonly http: AxiosInstance,
  ) {}

  async search(query: string): Promise<GeocodingResult[]> {
    const { data } = await this.http.get<GeocodingResult[]>("/search", {
      params: { q: query, format: "json", limit: 5 },
    });
    return data;
  }

  async reverse(lat: number, lon: number): Promise<GeocodingResult | null> {
    const { data } = await this.http.get<GeocodingResult>("/reverse", {
      params: { lat, lon, format: "json" },
    });
    // Nominatim returns an object with an `error` field when no result is found.
    if (!data || typeof (data as unknown as Record<string, unknown>)['error'] === 'string') {
      return null;
    }
    return data;
  }
}
