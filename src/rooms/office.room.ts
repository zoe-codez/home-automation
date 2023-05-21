import {
  DeterministicSwitch,
  SceneRoom,
  SolarCalcService,
  SolarEvent,
  refTimes,
} from "@digital-alchemy/automation-logic";
import { AutoLogService, Cron } from "@digital-alchemy/boilerplate";
import {
  ENTITY_STATE,
  InjectCallProxy,
  InjectEntityProxy,
  OnEntityUpdate,
  TemplateButton,
  iCallService,
} from "@digital-alchemy/home-assistant";
import dayjs from "dayjs";

import { OfficeScenes } from "src/includes/room-config";
import { Office1Pico, OfficePico } from "../includes";

const TARGET_FAN = "fan.office_ceiling_fan";

@SceneRoom({
  name: "office",
  scenes: {
    auto: {
      "light.monitor_bloom": { brightness: 255, state: "on" },
      "light.office_closet": { brightness: 200, state: "on" },
      "light.office_fan": { brightness: 150, state: "on" },
      "switch.desk_light": { state: "on" },
      "switch.mega_matrix": { state: "on" },
    },
    dim: {
      "light.monitor_bloom": { brightness: 150, state: "on" },
      "light.office_closet": { brightness: 150, state: "on" },
      "light.office_fan": { brightness: 100, state: "on" },
      "switch.desk_light": { state: "off" },
      "switch.mega_matrix": { state: "on" },
    },
    evening: {
      "light.monitor_bloom": { brightness: 150, state: "on" },
      "light.office_closet": { brightness: 150, state: "on" },
      "light.office_fan": { brightness: 50, state: "on" },
      "switch.desk_light": { state: "off" },
      "switch.mega_matrix": { state: "on" },
    },
    high: {
      "light.monitor_bloom": { brightness: 255, state: "on" },
      "light.office_closet": { brightness: 255, state: "on" },
      "light.office_fan": { brightness: 255, state: "on" },
      "switch.desk_light": { state: "on" },
      "switch.mega_matrix": { state: "on" },
    },
    meeting: {
      "light.monitor_bloom": { brightness: 255, state: "on" },
      "light.office_closet": { brightness: 200, state: "on" },
      "light.office_fan": { brightness: 100, state: "on" },
      "switch.desk_light": { state: "off" },
      "switch.mega_matrix": { state: "on" },
    },
    night: {
      "light.monitor_bloom": { brightness: 75, state: "on" },
      "light.office_closet": { state: "off" },
      "light.office_fan": { brightness: 40, state: "on" },
      "switch.desk_light": { state: "off" },
      "switch.mega_matrix": { state: "on" },
    },
    off: {
      "light.monitor_bloom": { state: "off" },
      "light.office_closet": { state: "off" },
      "light.office_fan": { state: "off" },
      "switch.desk_light": { state: "off" },
      "switch.foot_fan": { state: "off" },
      "switch.mega_matrix": { state: "off" },
    },
  },
})
export class Office {
  constructor(
    private readonly logger: AutoLogService,
    @InjectCallProxy()
    private readonly call: iCallService,
    private readonly solar: SolarCalcService,
    @InjectEntityProxy("binary_sensor.should_sleep")
    private readonly shouldSleep: ENTITY_STATE<"binary_sensor.should_sleep">,
    @InjectEntityProxy("binary_sensor.zoe_is_home")
    private readonly isHome: ENTITY_STATE<"binary_sensor.zoe_is_home">,
    @InjectEntityProxy("binary_sensor.is_late")
    private readonly isLate: ENTITY_STATE<"binary_sensor.is_late">,
    @InjectEntityProxy("switch.windows_open")
    private readonly windowOpen: ENTITY_STATE<"switch.windows_open">,
    @InjectEntityProxy("binary_sensor.is_rainy_weather")
    private readonly rainyWeather: ENTITY_STATE<"binary_sensor.is_rainy_weather">,
    @InjectEntityProxy("switch.office_plants")
    private readonly officePlants: ENTITY_STATE<"switch.office_plants">,
    @InjectEntityProxy("sensor.office_current_scene")
    private readonly sceneEntity: ENTITY_STATE<"sensor.office_current_scene">,
    @InjectEntityProxy("switch.meeting_mode")
    private readonly meetingModeSwitch: ENTITY_STATE<"switch.meeting_mode">,
  ) {}

  public get currentScene() {
    return this.sceneEntity.attributes.scene as OfficeScenes;
  }

  private get meetingMode() {
    return this.meetingModeSwitch.state === "on";
  }

  @DeterministicSwitch({
    entity_id: "switch.blanket_light",
    onEntityUpdate: ["switch.meeting_mode"],
  })
  protected get blanketLightShouldBeOn() {
    if (this.isHome.state === "off") {
      return false;
    }
    if (this.meetingMode) {
      return true;
    }
    const [AM7, PM7] = refTimes(["07:00:00", "19:00:00"]);
    return !dayjs().isBetween(AM7, PM7);
  }

  @DeterministicSwitch({
    entity_id: "switch.fairy_lights",
  })
  protected get fairyLightShouldBeOn() {
    if (this.isHome.state === "off") {
      return false;
    }
    const [AM7, PM10] = refTimes(["07:00:00", "22:00:00"]);
    return dayjs().isBetween(AM7, PM10);
  }

  @DeterministicSwitch({
    entity_id: "switch.office_plants",
    onEntityUpdate: [
      "sensor.office_current_scene",
      "binary_sensor.is_rainy_weather",
      "switch.meeting_mode",
    ],
    onEvent: [SolarEvent("sunset")],
  })
  protected get plantsShouldBeOn() {
    if (this.meetingMode) {
      return false;
    }
    const [PM3] = refTimes(["15"]);
    if (!this.solar.between("sunrise", "sunset")) {
      return false;
    }
    if (dayjs().isBefore(PM3)) {
      return true;
    }
    if (this.currentScene !== "high") {
      return false;
    }
    if (this.rainyWeather.state === "on") {
      return false;
    }
    return this.officePlants.state === "on";
  }

  @DeterministicSwitch({
    entity_id: "switch.wax_warmer",
    onEntityUpdate: ["switch.windows_open", "sensor.office_current_scene"],
  })
  protected get waxWarmerShouldBeOn() {
    if (this.windowOpen.state === "on") {
      return false;
    }
    return this.currentScene !== "off";
  }

  @Cron("30 22 * * *")
  protected async eveningHandOff(force = false): Promise<void> {
    if (!(force || ["auto", "dim"].includes(this.currentScene))) {
      return;
    }
    await this.call.scene.turn_on({
      entity_id: "scene.office_evening",
    });
  }

  @Office1Pico(["lower"])
  protected async fanDown(): Promise<void> {
    await this.call.fan.decrease_speed({
      entity_id: TARGET_FAN,
    });
  }

  @Office1Pico(["raise", "raise"])
  protected async fanHigh(): Promise<void> {
    await this.call.fan.set_percentage({
      entity_id: TARGET_FAN,
      percentage: 100,
    });
  }

  @Office1Pico(["lower", "lower"])
  protected async fanOff(): Promise<void> {
    await this.call.fan.turn_off({
      entity_id: TARGET_FAN,
    });
  }

  @Office1Pico(["raise"])
  protected async fanUp(): Promise<void> {
    await this.call.fan.increase_speed({
      entity_id: TARGET_FAN,
    });
  }

  @Office1Pico(["stop", "stop"])
  @TemplateButton("button.office_focus")
  protected async focus(): Promise<void> {
    if (this.shouldSleep.state === "on") {
      this.logger.info("Evening handoff redirect");
      await this.eveningHandOff(true);
      return;
    }
    const [PM1030] = refTimes(["22:30"]);
    this.logger.info("Office focus");
    await this.call.scene.turn_on({
      entity_id: [
        "scene.loft_off",
        "scene.misc_off",
        "scene.games_off",
        "scene.bedroom_off",
        "scene.kitchen_off",
        "scene.living_off",
        dayjs().isAfter(PM1030) ? "scene.office_night" : "scene.office_auto",
      ],
    });
  }

  @Office1Pico(["on", "on"])
  protected async globalOn(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: [
        "scene.loft_high",
        "scene.office_high",
        "scene.bedroom_high",
        "scene.kitchen_high",
        "scene.living_high",
      ],
    });
  }

  @OnEntityUpdate("switch.meeting_mode")
  protected async onMeetingModeChange(): Promise<void> {
    if (this.meetingMode) {
      if (this.currentScene === "high") {
        await this.call.scene.turn_on({
          entity_id: "scene.office_meeting",
        });
        return;
      }
      return;
    }
    if (this.currentScene === "meeting") {
      await this.call.scene.turn_on({
        entity_id: "scene.office_high",
      });
    }
  }

  @OfficePico(["stop", "stop"])
  protected async setAuto(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: "scene.office_auto",
    });
  }

  @OfficePico(["on"])
  @Office1Pico(["on"])
  protected async setHigh(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: "scene.office_high",
    });
  }

  @OfficePico(["off"])
  @Office1Pico(["off"])
  protected async setOff(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: "scene.office_off",
    });
  }

  @Office1Pico(["stop", "raise"])
  protected async toggleFootFan(): Promise<void> {
    await this.call.switch.toggle({
      entity_id: ["switch.foot_fan"],
    });
  }

  @Office1Pico(["stop", "on"])
  protected async toggleMeetingMode(): Promise<void> {
    await this.call.switch.toggle({
      entity_id: "switch.meeting_mode",
    });
  }
}
