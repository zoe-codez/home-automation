/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  DeterministicSwitch,
  SceneRoom,
  SolarCalcService,
  SolarEvent,
} from "@digital-alchemy/automation-logic";
import { AutoLogService } from "@digital-alchemy/boilerplate";
import { GotifyApp, MessagePriority, SendFrom } from "@digital-alchemy/gotify";
import {
  ENTITY_STATE,
  InjectCallProxy,
  InjectEntityProxy,
  OnEntityUpdate,
  TemplateButton,
  iCallService,
} from "@digital-alchemy/home-assistant";
import { HALF, MINUTE, sleep } from "@digital-alchemy/utilities";

import {
  BedPico,
  BedroomPico,
  GaragePico,
  LivingPico,
  LoftPico,
} from "../includes";

@SceneRoom({
  name: "misc",
  scenes: {
    high: {
      "switch.front_door": { state: "on" },
      "switch.loft_hallway_light": { state: "off" },
      "switch.stair_lights": { state: "on" },
    },
    off: {
      "switch.front_door": { state: "off" },
      "switch.loft_hallway_light": { state: "off" },
      "switch.stair_lights": { state: "off" },
    },
  },
})
export class AllRooms {
  constructor(
    private readonly logger: AutoLogService,
    @InjectCallProxy()
    private readonly call: iCallService,
    private readonly solar: SolarCalcService,
    @SendFrom("controller") private readonly notify: GotifyApp,
    @InjectEntityProxy("lock.front_door")
    private readonly lockFront: ENTITY_STATE<"lock.front_door">,
    @InjectEntityProxy("lock.back_door")
    private readonly lockBack: ENTITY_STATE<"lock.back_door">,
    @InjectEntityProxy("binary_sensor.zoe_is_home")
    private readonly isHome: ENTITY_STATE<"binary_sensor.zoe_is_home">,
  ) {}

  public isAway = false;

  @DeterministicSwitch({
    entity_id: "switch.front_porch_light",
    onEvent: [SolarEvent("dawn"), SolarEvent("dusk")],
  })
  protected get patioLightsShouldBeOn() {
    return !this.solar.between("dawn", "dusk");
  }

  @TemplateButton("button.lock_up")
  @BedroomPico(["off", "off"])
  @GaragePico(["off", "off"])
  @LivingPico(["off", "off"])
  @LoftPico(["off", "off"])
  @BedPico(["off"])
  public async globalOff(): Promise<void> {
    this.logger.warn("Lock up");

    // * Locks
    this.logger.debug("Locks");
    await this.call.lock.lock({
      entity_id: ["lock.back_door", "lock.front_door"],
    });

    // * Scenes
    this.logger.debug("Scenes");
    await this.call.scene.turn_on({
      entity_id: [
        "scene.kitchen_off",
        "scene.bedroom_off",
        "scene.office_off",
        "scene.living_off",
        "scene.games_off",
        "scene.loft_off",
      ],
    });

    // * Fans
    this.logger.debug("Fans");
    await this.call.fan.turn_off({
      entity_id: [
        "fan.office_ceiling_fan",
        "fan.living_ceiling_fan",
        "fan.games_ceiling_fan",
        "fan.loft_ceiling_fan",
        "fan.bedroom_ceiling_fan",
      ],
    });

    // * Switches
    this.logger.debug("Switches");
    await this.call.switch.turn_off({
      entity_id: [
        "switch.guest_mode",
        "switch.tent_debug",
        "switch.audio_power",
        "switch.ice_maker",
      ],
    });
    await sleep(HALF * MINUTE);
    if (this.lockFront.state !== "locked") {
      this.notify({
        message: `Front door stuck state: ${this.lockFront.state}`,
        priority: MessagePriority.normal,
      });
    }
    if (this.lockBack.state !== "locked") {
      this.notify({
        message: `Back door stuck state: ${this.lockBack.state}`,
        priority: MessagePriority.normal,
      });
    }
  }

  @OnEntityUpdate("binary_sensor.zoe_is_home")
  public async onHomeStateChange(): Promise<void> {
    if (this.isHome.state === "on") {
      await this.call.scene.turn_on({
        entity_id: ["scene.kitchen_high", "scene.living_high"],
      });
      return;
    }
    await this.call.button.press({
      entity_id: "button.lock_up",
    });
  }
}
