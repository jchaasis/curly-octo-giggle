import { Inject, Injectable } from "@nestjs/common";
import { AxiosInstance } from "axios";
import { AXIOS_NOAA } from "./client.tokens";

export interface INoaaClient {
  getPlasma(): Promise<unknown>;
  getMag(): Promise<unknown>;
  getKpPrimary(): Promise<unknown>;
  getKpFallback(): Promise<unknown>;
  getFlares(): Promise<unknown>;
  getAlerts(): Promise<unknown>;
}

@Injectable()
export class NoaaClient implements INoaaClient {
  constructor(@Inject(AXIOS_NOAA) private readonly http: AxiosInstance) {}

  async getPlasma(): Promise<unknown> {
    const { data } = await this.http.get(
      "/products/solar-wind/plasma-7-day.json",
    );
    return data;
  }

  async getMag(): Promise<unknown> {
    const { data } = await this.http.get("/products/solar-wind/mag-7-day.json");
    return data;
  }

  async getKpPrimary(): Promise<unknown> {
    const { data } = await this.http.get(
      "/products/noaa-planetary-k-index.json",
    );
    return data;
  }

  async getKpFallback(): Promise<unknown> {
    const { data } = await this.http.get(
      "/products/noaa-estimated-planetary-k-index-1-minute.json",
    );
    return data;
  }

  async getFlares(): Promise<unknown> {
    const { data } = await this.http.get("/json/solar-geophysical-activity.json");
    return data;
  }

  async getAlerts(): Promise<unknown> {
    const { data } = await this.http.get("/products/alerts.json");
    return data;
  }
}
