import {
  DeterministicSwitch,
  SceneRoom,
  refTimes,
} from "@digital-alchemy/automation-logic";
import { AutoLogService, Cron } from "@digital-alchemy/boilerplate";
import {
  ENTITY_STATE,
  InjectCallProxy,
  InjectEntityProxy,
  TemplateButton,
  iCallService,
} from "@digital-alchemy/home-assistant";
import { CronExpression, HALF } from "@digital-alchemy/utilities";
import { isDateString } from "class-validator";
import dayjs from "dayjs";

import { LivingScenes } from "src/includes/room-config";
import { LivingPico } from "../includes";

@SceneRoom({
  name: "living",
  scenes: {
    auto: {
      "light.living_room_fan": { brightness: 100, state: "on" },
      "light.tower_left": { brightness: 200, state: "on" },
      "light.tower_right": { brightness: 200, state: "on" },
      "switch.living_room_accessories": { state: "on" },
    },
    dimmed: {
      "light.living_room_fan": { brightness: 100, state: "on" },
      "light.tower_left": { brightness: 200, state: "on" },
      "light.tower_right": { brightness: 200, state: "on" },
      "switch.living_room_accessories": { state: "on" },
    },
    evening: {
      "light.living_room_fan": { brightness: 30, state: "on" },
      "light.tower_left": { brightness: 40, state: "on" },
      "light.tower_right": { brightness: 40, state: "on" },
      "switch.living_room_accessories": { state: "off" },
    },
    evening_high: {
      "light.living_room_fan": { brightness: 200, state: "on" },
      "light.tower_left": { brightness: 200, state: "on" },
      "light.tower_right": { brightness: 200, state: "on" },
      "switch.living_room_accessories": { state: "on" },
    },
    high: {
      "light.living_room_fan": { brightness: 255, state: "on" },
      "light.tower_left": { brightness: 255, state: "on" },
      "light.tower_right": { brightness: 255, state: "on" },
      "switch.living_room_accessories": { state: "on" },
    },
    off: {
      "light.living_room_fan": { state: "off" },
      "light.tower_left": { state: "off" },
      "light.tower_right": { state: "off" },
      "switch.living_room_accessories": { state: "off" },
    },
  },
})
export class LivingRoom {
  constructor(
    private readonly logger: AutoLogService,
    @InjectEntityProxy("switch.downstairs_auto_wax")
    private readonly autoWax: ENTITY_STATE<"switch.downstairs_auto_wax">,
    @InjectEntityProxy("switch.guest_mode")
    private readonly guestMode: ENTITY_STATE<"switch.guest_mode">,
    @InjectEntityProxy("switch.windows_open")
    private readonly windowsOpen: ENTITY_STATE<"switch.windows_open">,
    @InjectEntityProxy("sensor.zoe_arrival_time")
    private readonly arrivalTime: ENTITY_STATE<"sensor.zoe_arrival_time">,
    @InjectEntityProxy("binary_sensor.zoe_is_home")
    private readonly isHome: ENTITY_STATE<"binary_sensor.zoe_is_home">,
    @InjectEntityProxy("binary_sensor.is_evening")
    private readonly isEvening: ENTITY_STATE<"binary_sensor.is_evening">,
    @InjectEntityProxy("binary_sensor.is_day")
    private readonly isDay: ENTITY_STATE<"binary_sensor.is_day">,
    @InjectCallProxy()
    private readonly call: iCallService,
    @InjectEntityProxy("sensor.living_current_scene")
    private readonly sceneEntity: ENTITY_STATE<"sensor.living_current_scene">,
  ) {}

  private get currentScene() {
    return this.sceneEntity.attributes.scene as LivingScenes;
  }

  @DeterministicSwitch({
    entity_id: "switch.media_backdrop",
    onEntityUpdate: ["binary_sensor.is_day", "sensor.living_current_scene"],
  })
  protected get mediaBackdropShouldBeOn(): boolean {
    if (this.isHome.state === "off") {
      return false;
    }
    if (this.isDay.state === "on") {
      return false;
    }
    return this.currentScene !== "high";
  }

  @DeterministicSwitch({
    entity_id: "switch.moon_mirror",
    onEntityUpdate: [
      "binary_sensor.is_evening",
      "binary_sensor.is_day",
      "switch.guest_mode",
    ],
  })
  protected get moonMirrorShouldBeOn(): boolean {
    if (this.isHome.state === "off") {
      return false;
    }
    const [PM5] = refTimes(["17"]);
    if (this.guestMode.state === "on" && dayjs().isAfter(PM5)) {
      return true;
    }
    if (this.isEvening.state === "on") {
      return true;
    }
    return this.isDay.state === "off";
  }

  /**
   * 1) late night cutoff
   * 2) guest mode
   * 3) >>> auto mode off (only mid-scenes)
   * 4) only while present
   * 5) if: recently arrived
   * 6) if: inside predefined windows
   */
  @DeterministicSwitch({
    entity_id: "switch.downstairs_wax_warmer",
    interval: "0 */15 * * * *",
    onEntityUpdate: [
      "switch.guest_mode",
      "switch.windows_open",
      "switch.downstairs_auto_wax",
      "binary_sensor.zoe_is_home",
      "sensor.living_current_scene",
    ],
  })
  protected get waxShouldBeOn(): boolean {
    if (this.isHome.state === "off") {
      return false;
    }
    if (this.windowsOpen.state === "on") {
      return false;
    }
    const now = dayjs();
    const [PM1030, AM7, onA, offA] = refTimes([
      // Hard block window
      "22:30:00",
      "07:00:00",
      // A
      "07:45:00",
      "09:00:00",
    ]);
    if (!now.isBetween(AM7, PM1030)) {
      return false;
    }
    if (this.guestMode.state === "on") {
      return true;
    }
    if (this.autoWax.state !== "on") {
      return false;
    }
    if (this.isHome.state === "off") {
      return false;
    }
    if (
      isDateString(this.arrivalTime.state) &&
      now.subtract(HALF, "hour").isBefore(this.arrivalTime.state)
    ) {
      return true;
    }
    if (!["off", "high"].includes(this.currentScene)) {
      return true;
    }
    return now.isBetween(onA, offA);
  }

  @Cron(CronExpression.EVERY_DAY_AT_10PM)
  protected async eveningHandoff(): Promise<void> {
    if (this.currentScene !== "auto") {
      return;
    }
    await this.call.scene.turn_on({
      entity_id: "scene.living_evening",
    });
  }

  @LivingPico(["stop", "stop", "stop"])
  @TemplateButton("button.living_room_focus")
  protected async focus(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: [
        "scene.loft_off",
        "scene.games_off",
        "scene.office_off",
        "scene.bedroom_off",
        "scene.misc_off",
        "scene.kitchen_off",
      ],
    });
  }

  @LivingPico(["off", "off"])
  protected async globalOff(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: [
        "scene.loft_off",
        "scene.games_off",
        "scene.office_off",
        "scene.bedroom_off",
        "scene.misc_off",
        "scene.kitchen_off",
        "scene.living_off",
      ],
    });
  }

  @LivingPico(["on", "on"])
  protected async globalOn(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: [
        "scene.loft_high",
        "scene.games_high",
        "scene.office_high",
        "scene.bedroom_high",
        "scene.kitchen_high",
        "scene.living_high",
      ],
    });
  }

  @LivingPico(["stop", "stop"])
  protected async setAuto(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: "scene.living_auto",
    });
  }

  @LivingPico(["on"])
  protected async setHigh(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: "scene.living_high",
    });
  }

  @LivingPico(["off"])
  protected async setOff(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: "scene.living_off",
    });
  }
}
