import { FetchService } from "@digital-alchemy/boilerplate";
import { Injectable } from "@nestjs/common";

@Injectable()
export class WeatherService {
  constructor(private readonly fetch: FetchService) {}

  public async getWeather(): Promise<string> {
    return await this.fetch.fetch({
      rawUrl: true,
      process: "text",
      url: `https://wttr.in`,
    });
  }
}
