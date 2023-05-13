import {
  LOCATION_UPDATED,
  SolarCalcService,
  SolarEvent,
  SolarEvents,
  refTimes,
} from "@digital-alchemy/automation-logic";
import { AutoLogService, Cron, OnEvent } from "@digital-alchemy/boilerplate";
import {
  ENTITY_STATE,
  EntityHistoryResult,
  EntityManagerService,
  InjectEntityProxy,
  InjectPushEntity,
  PUSH_PROXY,
  SOCKET_READY,
  TemplateButton,
} from "@digital-alchemy/home-assistant";
import {
  CronExpression,
  DOWN,
  HALF,
  SINGLE,
  START,
  TitleCase,
  UP,
  is,
} from "@digital-alchemy/utilities";
import { Injectable } from "@nestjs/common";
import dayjs, { Dayjs } from "dayjs";

@Injectable()
export class SensorSyncService {
  constructor(
    @InjectEntityProxy("weather.home")
    private readonly weatherHome: ENTITY_STATE<"weather.home">,
    private readonly entityManager: EntityManagerService,
    private readonly logger: AutoLogService,
    @InjectPushEntity("sensor.next_solar_event")
    private readonly nextEvent: PUSH_PROXY<"sensor.next_solar_event">,
    @InjectPushEntity("sensor.next_solar_event_time")
    private readonly nextEventTime: PUSH_PROXY<"sensor.next_solar_event_time">,
    @InjectPushEntity("sensor.downstairs_wax_melt_time")
    private readonly downstairsMeltTime: PUSH_PROXY<"sensor.downstairs_wax_melt_time">,
    @InjectPushEntity("sensor.office_wax_melt_time")
    private readonly officeMeltTime: PUSH_PROXY<"sensor.office_wax_melt_time">,
    @InjectPushEntity("binary_sensor.is_past_solar_noon")
    private readonly isPastNoon: PUSH_PROXY<"binary_sensor.is_past_solar_noon">,
    private readonly solar: SolarCalcService,
    private readonly calc: SolarCalcService,
    /**
     * 11AM - 6PM
     */
    @InjectPushEntity("binary_sensor.is_afternoon")
    private readonly isAfternoon: PUSH_PROXY<"binary_sensor.is_afternoon">,
    /**
     * dawn - dusk
     */
    @InjectPushEntity("binary_sensor.is_day")
    private readonly isDay: PUSH_PROXY<"binary_sensor.is_day">,
    /**
     * dawn - 7:30
     */
    @InjectPushEntity("binary_sensor.is_early")
    private readonly isEarly: PUSH_PROXY<"binary_sensor.is_early">,
    /**
     * 6PM - SLEEP (after 10PM)
     */
    @InjectPushEntity("binary_sensor.is_evening")
    private readonly isEvening: PUSH_PROXY<"binary_sensor.is_evening">,
    /**
     * Full available work hours, weekdays
     *
     * 8:30AM - 5:30PM
     */
    @InjectPushEntity("binary_sensor.is_fullwork")
    private readonly isFullWork: PUSH_PROXY<"binary_sensor.is_fullwork">,
    /**
     * (after sunset | 9:45PM) - dawn
     */
    @InjectPushEntity("binary_sensor.is_late")
    private readonly isLate: PUSH_PROXY<"binary_sensor.is_late">,
    /**
     * (WAKEUP/8:30) - 11AM
     */
    @InjectPushEntity("binary_sensor.is_morning")
    private readonly isMorning: PUSH_PROXY<"binary_sensor.is_morning">,
    /**
     * Approx stock market hours, no accounting for holidays
     *
     * - 8:30AM - 3PM
     */
    @InjectPushEntity("binary_sensor.is_work")
    private readonly isWork: PUSH_PROXY<"binary_sensor.is_work">,
    /**
     * Go to bed!
     *
     * - 11PM - 7AM
     */
    @InjectPushEntity("binary_sensor.should_sleep")
    private readonly shouldSleep: PUSH_PROXY<"binary_sensor.should_sleep">,
    @InjectPushEntity("binary_sensor.is_rainy_weather")
    private readonly rainyWeather: PUSH_PROXY<"binary_sensor.is_rainy_weather">,
    @InjectEntityProxy("switch.downstairs_wax_warmer")
    private readonly downstairsWaxWarmer: ENTITY_STATE<"switch.downstairs_wax_warmer">,
    @InjectEntityProxy("switch.wax_warmer")
    private readonly officeWaxWarmer: ENTITY_STATE<"switch.wax_warmer">,
  ) {}

  private downstairsWaxCheckIn: Dayjs;
  private officeWaxCheckIn: Dayjs;

  protected onApplicationBootstrap(): void {
    this.onSolarEvent();
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  @OnEvent({ events: [SOCKET_READY, LOCATION_UPDATED] })
  protected async onDayPhaseUpdate(): Promise<void> {
    const now = dayjs();
    const calc = await this.calc.getCalc();
    const [AM11, PM6, EOD, PM9, AM830, PM3, AM7, PM530, PM11] = refTimes([
      "11",
      "18",
      "24",
      "21",
      "08:30",
      "15",
      "07",
      "17:30",
      "23",
    ]);

    this.isAfternoon.state = now.isBetween(AM11, PM6);
    this.isDay.state = now.isBetween(calc.dawn, calc.dusk);
    this.isEarly.state = now.isBetween(calc.dawn, AM7);
    this.isEvening.state = now.isBetween(PM6, EOD);
    this.isLate.state = !now.isBetween(calc.dawn, PM9);
    this.isMorning.state = now.isBetween(AM830, AM11);
    this.isWork.state = now.isBetween(AM830, PM3);
    this.isFullWork.state = now.isBetween(AM830, PM530);
    this.shouldSleep.state = !now.isBetween(PM11, AM7);
  }

  @OnEvent(SOCKET_READY)
  @Cron(CronExpression.EVERY_10_SECONDS)
  protected onDownstairsWaxUpdate(): void {
    const on = this.downstairsWaxWarmer.state === "on";
    const current = Number(
      is.string(this.downstairsMeltTime.state) ||
        is.number(this.downstairsMeltTime.state)
        ? this.downstairsMeltTime.state
        : START,
    );
    const now = dayjs();
    if (!on) {
      if (this.downstairsWaxCheckIn) {
        this.downstairsMeltTime.state =
          current + Number(now.diff(this.downstairsWaxCheckIn, "s"));
        this.downstairsWaxCheckIn = undefined;
        return;
      }
      return;
    }
    if (!this.downstairsWaxCheckIn) {
      this.downstairsWaxCheckIn = dayjs();
      return;
    }
    this.downstairsMeltTime.state =
      current + Number(now.diff(this.downstairsWaxCheckIn, "s"));
    this.downstairsWaxCheckIn = dayjs();
  }

  @OnEvent(SOCKET_READY)
  @Cron(CronExpression.EVERY_10_SECONDS)
  protected onOfficeWaxUpdate(): void {
    const on = this.officeWaxWarmer.state === "on";
    const current = Number(
      is.string(this.officeMeltTime.state) ||
        is.number(this.officeMeltTime.state)
        ? this.officeMeltTime.state
        : START,
    );
    const now = dayjs();
    if (!on) {
      if (this.officeWaxCheckIn) {
        this.officeMeltTime.state =
          current + Number(now.diff(this.officeWaxCheckIn, "s"));
        this.officeWaxCheckIn = undefined;
        return;
      }
      return;
    }
    if (!this.officeWaxCheckIn) {
      this.officeWaxCheckIn = dayjs();
      return;
    }
    this.officeMeltTime.state =
      current + Number(now.diff(this.officeWaxCheckIn, "s"));
    this.officeWaxCheckIn = dayjs();
  }

  @TemplateButton("button.reset_downstairs_wax_melt_time")
  protected onResetDownstairsWax(): void {
    this.downstairsMeltTime.state = START;
  }

  @TemplateButton("button.reset_office_wax_melt_time")
  protected onResetOfficeWax(): void {
    this.officeMeltTime.state = START;
  }

  @SolarEvent("*")
  @OnEvent(SOCKET_READY)
  protected onSolarEvent(): void {
    const calc = this.solar.getCalcSync();
    const now = dayjs();
    this.isPastNoon.state = now.isAfter(calc.solarNoon);
    const entry =
      (["dawn", "dusk", "solarNoon", "sunrise", "sunset"] as SolarEvents[])
        .sort((a, b) => (dayjs(calc[a]).isAfter(calc[b]) ? UP : DOWN))
        .find(i => now.isBefore(calc[i])) ?? "";
    if (!entry) {
      this.nextEvent.state = "";
      this.nextEventTime.state = "";
      return;
    }
    this.nextEvent.state = TitleCase(entry);
    this.nextEventTime.state = dayjs(calc[entry]).format("hh:mm");
  }

  @Cron(CronExpression.EVERY_HOUR)
  @OnEvent(SOCKET_READY)
  protected async onWeatherUpdate(): Promise<void> {
    const results = await this.entityManager.history({
      end_time: dayjs(),
      entity_ids: ["weather.home"],
      no_attributes: true,
      start_time: dayjs().subtract(SINGLE, "day"),
    });
    const list = results[
      "weather.home"
    ] as EntityHistoryResult<"weather.home">[];
    const past = list.map(({ state }) => state);
    const rainyList = ["partlycloudy", "cloudy", "rainy"];
    const cutoff = dayjs().add(HALF, "day");
    const future = this.weatherHome.attributes.forecast
      .filter(i => cutoff.isAfter(i.datetime))
      .map(({ condition }) => condition);
    const allStates = is.unique([...past, ...future, this.weatherHome.state]);
    this.rainyWeather.state = rainyList.some(i => allStates.includes(i));
  }
}
