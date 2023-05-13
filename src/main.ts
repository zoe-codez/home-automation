import { AutoLogService, QuickScript } from "@digital-alchemy/boilerplate";
import { WeatherService } from "./services";

@QuickScript({
  application: "example-script",
  providers: [WeatherService],
})
export class ExampleScript {
  constructor(
    private readonly logger: AutoLogService,
    private readonly weather: WeatherService,
  ) {}

  public async exec() {
    this.logger.info(`Fetching weather`);
    const weather = await this.weather.getWeather();
    console.log(weather);
  }
}
