import { SceneRoom, SolarEvent } from "@digital-alchemy/automation-logic";
import {
  AutoLogService,
  Cron,
  CronExpression,
} from "@digital-alchemy/boilerplate";
import {
  ENTITY_STATE,
  InjectCallProxy,
  InjectEntityProxy,
  OnEntityUpdate,
  iCallService,
} from "@digital-alchemy/home-assistant";

import { LoftPico } from "../includes";

const WARM_OUTSIDE_TEMP = 85;

@SceneRoom({
  name: "loft",
  scenes: {
    auto: {
      "light.loft_fan": { brightness: 150, state: "on" },
    },
    evening_auto: {
      "light.loft_fan": { brightness: 50, state: "on" },
    },
    evening_high: {
      "light.loft_fan": { brightness: 175, state: "on" },
    },
    high: {
      "light.loft_fan": { brightness: 255, state: "on" },
    },
    off: {
      "light.loft_fan": { state: "off" },
    },
    to_bed: {
      "light.loft_fan": { brightness: 10, state: "on" },
    },
  },
})
export class Loft {
  constructor(
    @InjectCallProxy()
    private readonly call: iCallService,
    private readonly logger: AutoLogService,
    @InjectEntityProxy("weather.home")
    private readonly weatherHome: ENTITY_STATE<"weather.home">,
    @InjectEntityProxy("binary_sensor.is_evening")
    private readonly isEvening: ENTITY_STATE<"binary_sensor.is_evening">,
    @InjectEntityProxy("switch.meeting_mode")
    private readonly meetingMode: ENTITY_STATE<"switch.meeting_mode">,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  @SolarEvent("dusk")
  public async iceMakerOff(): Promise<void> {
    await this.call.switch.turn_off({
      entity_id: "switch.ice_maker",
    });
  }

  @Cron("30 07 * * *")
  public async iceMakerOn(): Promise<void> {
    await this.call.switch.turn_on({
      entity_id: "switch.ice_maker",
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_3PM)
  protected async earlierIceMakerOff() {
    if (this.weatherHome.attributes.temperature < WARM_OUTSIDE_TEMP) {
      this.logger.debug(`Early ice maker off`);
      await this.iceMakerOff();
    }
  }

  @OnEntityUpdate("switch.meeting_mode")
  protected onMeetingModeChange(): void {
    if (this.meetingMode.state === "on") {
      this.iceMakerOff();
    }
  }

  @LoftPico(["stop", "stop"])
  protected async setAuto(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: "scene.loft_auto",
    });
  }

  @LoftPico(["on"])
  protected async setHigh(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: "scene.loft_high",
    });
  }

  @LoftPico(["off"])
  protected async setOff(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: "scene.loft_off",
    });
  }
}
