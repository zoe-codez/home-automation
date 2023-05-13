import {
  DeterministicSwitch,
  refTimes,
  ROOM_SCENES,
  SceneRoom,
} from "@digital-alchemy/automation-logic";
import { AutoLogService } from "@digital-alchemy/boilerplate";
import { GotifyApp, SendFrom } from "@digital-alchemy/gotify";
import {
  ENTITY_STATE,
  iCallService,
  InjectCallProxy,
  InjectEntityProxy,
  OnEntityUpdate,
} from "@digital-alchemy/home-assistant";
import dayjs from "dayjs";

import { BedPico, BedroomPico, RoomNames } from "../includes";

@SceneRoom({
  name: "bedroom",
  scenes: {
    auto: {
      "light.bedroom_ceiling_fan": { brightness: 75, state: "on" },
      "light.dangle": { brightness: 150, state: "on" },
      "light.womp": { brightness: 255, state: "on" },
    },
    dimmed: {
      "light.bedroom_ceiling_fan": { brightness: 75, state: "on" },
      "light.dangle": { brightness: 150, state: "on" },
      "light.womp": { brightness: 255, state: "on" },
    },
    early: {
      "light.bedroom_ceiling_fan": { brightness: 75, state: "on" },
      "light.dangle": { brightness: 200, state: "on" },
      "light.womp": { brightness: 255, state: "on" },
    },
    high: {
      "light.bedroom_ceiling_fan": { brightness: 255, state: "on" },
      "light.dangle": { brightness: 255, state: "on" },
      "light.womp": { brightness: 255, state: "on" },
    },
    high_dimmed: {
      "light.bedroom_ceiling_fan": { brightness: 200, state: "on" },
      "light.dangle": { brightness: 200, state: "on" },
      "light.womp": { brightness: 255, state: "on" },
    },
    night: {
      "light.bedroom_ceiling_fan": { state: "off" },
      "light.dangle": { brightness: 75, state: "on" },
      "light.womp": { brightness: 50, state: "on" },
    },
    off: {
      "light.bedroom_ceiling_fan": { state: "off" },
      "light.dangle": { state: "off" },
      "light.womp": { state: "off" },
    },
  },
})
export class Bedroom {
  constructor(
    @InjectCallProxy()
    private readonly call: iCallService,
    private readonly logger: AutoLogService,
    @InjectEntityProxy("binary_sensor.is_late")
    private readonly isLate: ENTITY_STATE<"binary_sensor.is_late">,
    @InjectEntityProxy("binary_sensor.is_evening")
    private readonly isEvening: ENTITY_STATE<"binary_sensor.is_evening">,
    @InjectEntityProxy("binary_sensor.zoe_is_home")
    private readonly isHome: ENTITY_STATE<"binary_sensor.zoe_is_home">,
    @InjectEntityProxy("sensor.bedroom_current_scene")
    private readonly sceneEntity: ENTITY_STATE<"sensor.bedroom_current_scene">,
  ) {}

  public name: RoomNames = "bedroom";
  private roomTurnedOff = false;

  /**
   * Little mood light that should be on to create mood mostly
   */
  @DeterministicSwitch({
    entity_id: "switch.stick_light",
    onEntityUpdate: [
      "binary_sensor.is_evening",
      "sensor.bedroom_current_scene",
    ],
  })
  protected get stickLightShouldBeOn(): boolean {
    if (this.isHome.state === "off") {
      return false;
    }
    if (this.isEvening.state === "off") {
      return false;
    }
    if (this.currentScene.includes("high")) {
      return false;
    }
    return !this.roomTurnedOff;
  }

  private get autoScene() {
    if (this.currentScene === "night") {
      return "scene.bedroom_auto";
    }
    return this.isLate.state === "off"
      ? "scene.bedroom_auto"
      : "scene.bedroom_night";
  }

  private get currentScene() {
    return this.sceneEntity.attributes.scene as ROOM_SCENES<"bedroom">;
  }

  private get highScene() {
    if (this.currentScene === "high_dimmed") {
      return "scene.bedroom_high";
    }
    return this.isLate.state === "off"
      ? "scene.bedroom_high_dimmed"
      : "scene.bedroom_high";
  }

  @BedroomPico(["off", "off"])
  public async globalOff(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: [
        "scene.loft_off",
        "scene.games_off",
        "scene.office_off",
        "scene.bedroom_off",
        "scene.kitchen_off",
        "scene.misc_off",
        "scene.living_off",
      ],
    });
  }

  @BedroomPico(["on", "on"])
  @BedPico(["on", "on"])
  public async globalOn(): Promise<void> {
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

  @BedroomPico(["stop", "stop"])
  @BedPico(["stop", "stop"])
  public async setAuto(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: this.autoScene,
    });
    const [AM8, AM4] = refTimes(["8", "4"]);
    if (dayjs().isBetween(AM4, AM8)) {
      await this.call.switch.turn_on({
        entity_id: ["switch.ice_maker"],
      });
    }
  }

  @BedroomPico(["on"])
  public async setHigh(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: this.highScene,
    });
  }

  @BedPico(["lower"])
  protected async fanDown(): Promise<void> {
    await this.call.fan.decrease_speed({
      entity_id: "fan.bedroom_ceiling_fan",
    });
  }

  @BedPico(["raise"])
  protected async fanUp(): Promise<void> {
    await this.call.fan.increase_speed({
      entity_id: "fan.bedroom_ceiling_fan",
    });
  }

  @OnEntityUpdate("sensor.bedroom_current_scene")
  protected onSceneChange(): void {
    const [PM9] = refTimes(["21"]);
    if (dayjs().isBefore(PM9)) {
      return;
    }
    this.roomTurnedOff = this.currentScene === "off";
  }

  @BedPico(["on"])
  protected async setHighBed(): Promise<void> {
    await this.setHigh();
    const [AM8, AM4] = refTimes(["8", "4"]);
    if (dayjs().isBetween(AM4, AM8)) {
      await this.call.switch.turn_on({
        entity_id: ["switch.ice_maker"],
      });
    }
  }

  @BedroomPico(["off"])
  protected async setOff(): Promise<void> {
    await this.call.scene.turn_on({
      entity_id: "scene.bedroom_off",
    });
  }
}
