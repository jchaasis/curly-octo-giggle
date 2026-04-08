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
}
