import {
  DeterministicSwitch,
  SceneRoom,
  SolarCalcService,
  refTimes,
} from "@digital-alchemy/automation-logic";
import { AutoLogService, Cron, OnEvent } from "@digital-alchemy/boilerplate";
import {
  ENTITY_STATE,
  iCallService,
  InjectCallProxy,
  InjectEntityProxy,
} from "@digital-alchemy/home-assistant";
import dayjs from "dayjs";

@SceneRoom({
  name: "kitchen",
  scenes: {
    auto: {
      "switch.bar_light": { state: "on" },
      "switch.dining_room_light": { state: "on" },
      "switch.kitchen_light": { state: "on" },
    },
    handoff: {
      "switch.alfred_light": { state: "off" },
      "switch.dining_room_light": { state: "off" },
    },
    high: {
      "switch.bar_light": { state: "on" },
      "switch.dining_room_light": { state: "on" },
      "switch.kitchen_light": { state: "on" },
    },
    off: {
      "switch.bar_light": { state: "off" },
      "switch.dining_room_light": { state: "off" },
      "switch.kitchen_light": { state: "off" },
    },
  },
})
export class Kitchen {
  constructor(
    private readonly logger: AutoLogService,
    private readonly solar: SolarCalcService,
    @InjectCallProxy()
    private readonly call: iCallService,
    @InjectEntityProxy("switch.alfred_light")
    private readonly alfredLight: ENTITY_STATE<"switch.alfred_light">,
    @InjectEntityProxy("switch.guest_mode")
    private readonly guestMode: ENTITY_STATE<"switch.guest_mode">,
  ) {}

  @DeterministicSwitch({
    entity_id: "switch.alfred_light",
    onEntityUpdate: ["switch.guest_mode"],
  })
  protected get alfredShouldBeOn() {
    const [late] = refTimes([this.guestMode.state === "on" ? "16" : "17:30"]);
    const now = dayjs();
    return this.solar.between("sunrise", "sunset") && now.isBefore(late);
  }

  @Cron("30 18 * * *" /* 6:30PM */)
  protected async quickEveningSwitch(): Promise<void> {
    if (this.alfredLight.state !== "on") {
      return;
    }
    await this.call.scene.turn_on({
      entity_id: "scene.kitchen_handoff",
    });
  }
}
