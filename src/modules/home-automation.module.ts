import { AutomationLogicModule } from "@digital-alchemy/automation-logic";
import {
  ApplicationModule,
  AutoLogService,
} from "@digital-alchemy/boilerplate";
import { GotifyModule } from "@digital-alchemy/gotify";
import {
  HomeAssistantModule,
  PushEntityConfigService,
  SocketManagerService,
} from "@digital-alchemy/home-assistant";
import { MQTTModule } from "@digital-alchemy/mqtt";
import { ServerModule } from "@digital-alchemy/server";
import { DiscoveryModule } from "@nestjs/core";

import { SNAPSHOT_BASE_FOLDER } from "../config";
import { AllRooms, Bedroom, Kitchen, LivingRoom, Loft, Office } from "../rooms";

@ApplicationModule({
  application: "home-automation",
  configuration: {
    [SNAPSHOT_BASE_FOLDER]: {
      default: "/snapshots",
      description:
        "Base directory that home assistant should save snapshots to",
      type: "string",
    },
  },
  imports: [
    AutomationLogicModule.forRoot({
      global_scenes: {
        auto: true,
        high: true,
        off: true,
      },
      room_configuration: {
        bedroom: {
          name: "Bedroom",
          scenes: {
            auto: {
              friendly_name: "Auto",
            },
            dimmed: {
              friendly_name: "Dimmed",
            },
            early: {
              friendly_name: "Early",
            },
            high: {
              friendly_name: "High",
            },
            high_dimmed: {
              friendly_name: "High dimmed",
            },
            night: {
              friendly_name: "Night",
            },
            off: {
              friendly_name: "Off",
            },
          },
        },
        kitchen: {
          name: "Kitchen",
          scenes: {
            auto: {
              friendly_name: "Auto",
            },
            handoff: {
              friendly_name: "Handoff",
            },
            high: {
              friendly_name: "High",
            },
            off: {
              friendly_name: "Off",
            },
          },
        },
        living: {
          name: "Living",
          scenes: {
            auto: {
              friendly_name: "Auto",
            },
            dimmed: {
              friendly_name: "Dimmed",
            },
            evening: {
              friendly_name: "Evening",
            },
            evening_high: {
              friendly_name: "Evening high",
            },
            high: {
              friendly_name: "High",
            },
            off: {
              friendly_name: "Off",
            },
          },
        },
        loft: {
          name: "Loft",
          scenes: {
            auto: {
              friendly_name: "Auto",
            },
            evening_auto: {
              friendly_name: "Evening auto",
            },
            evening_high: {
              friendly_name: "Evening high",
            },
            high: {
              friendly_name: "High",
            },
            off: {
              friendly_name: "Off",
            },
            to_bed: {
              friendly_name: "To bed",
            },
          },
        },
        misc: {
          name: "Misc",
          scenes: {
            auto: {
              friendly_name: "Auto",
            },
            high: {
              friendly_name: "High",
            },
            off: {
              friendly_name: "Off",
            },
          },
        },
        office: {
          name: "Office",
          scenes: {
            auto: {
              friendly_name: "Auto",
            },
            dim: {
              friendly_name: "Dim",
            },
            evening: {
              friendly_name: "Evening",
            },
            high: {
              friendly_name: "High",
            },
            meeting: {
              friendly_name: "Meeting",
            },
            night: {
              friendly_name: "Night",
            },
            off: {
              friendly_name: "Off",
            },
          },
        },
      },
    }),
    DiscoveryModule,
    GotifyModule.forRoot(),
    HomeAssistantModule.forRoot({
      controllers: true,
      generate_entities: {
        binary_sensor: {
          is_afternoon: {
            name: "Is afternoon",
          },
          is_day: {
            name: "Is day",
          },
          is_early: {
            name: "Is early",
          },
          is_evening: {
            name: "Is evening",
          },
          is_fullwork: {
            name: "Is full work",
          },
          is_late: {
            name: "Is late",
          },
          is_morning: {
            name: "Is morning",
          },
          is_past_solar_noon: {
            icon: "mdi:sun-angle",
            name: "Past solar noon",
          },
          is_rainy_weather: {
            name: "Is rainy weather",
          },
          is_work: {
            name: "Is work",
          },
          should_open_windows: {
            icon: "mdi:window-open",
            name: "Should open windows",
          },
          should_sleep: {
            name: "Should sleep",
          },
          zoe_is_home: {
            name: "Zoe is home",
          },
        },
        button: {
          living_room_focus: {
            icon: "mdi:focus-field",
            name: "Living room focus",
          },
          lock_up: {
            icon: "mdi:door-closed-lock",
            name: "Lock up",
          },
          office_focus: {
            icon: "mdi:focus-field",
            name: "Office focus",
          },
          reset_downstairs_wax_melt_time: {
            icon: "mdi:clock-start",
            name: "Reset downstairs wax melt time",
          },
          reset_office_wax_melt_time: {
            icon: "mdi:clock-start",
            name: "Reset office wax melt time",
          },
        },
        sensor: {
          downstairs_wax_melt_time: {
            device_class: "duration",
            name: "Downstairs wax melt time",
            unit_of_measurement: "s",
          },
          exterior_timelapse_frame_count: {
            name: "Exterior timelapse frame count",
          },
          last_exterior_timelapse_timestamp: {
            device_class: "timestamp",
            icon: "mdi:camera-front",
            name: "Last exterior timelapse picture",
          },
          light_temperature: {
            device_class: "temperature",
            icon: "mdi:sun-thermometer",
            name: "Light temperature",
            unit_of_measurement: "K",
          },
          next_solar_event: {
            icon: "mdi:sun-compass",
            name: "Next solar event",
          },
          next_solar_event_time: {
            icon: "mdi:sun-clock",
            name: "Next solar event time",
          },
          office_wax_melt_time: {
            device_class: "duration",
            name: "Office wax melt time",
            unit_of_measurement: "s",
          },
          zoe_arrival_time: {
            device_class: "timestamp",
            name: "Zoe arrival time",
          },
        },
        switch: {
          downstairs_auto_wax: {
            icon: "mdi:home-clock",
            name: "Downstairs auto wax schedule",
          },
          enable_exterior_timelapse: {
            icon: "mdi:timelapse",
            name: "Exterior timelapse",
          },
          guest_mode: {
            icon: "mdi:account-group-outline",
            name: "Guest mode",
          },
          house_low_power: {
            icon: "mdi:wind-turbine-alert",
            name: "House low power",
          },
          meeting_mode: {
            icon: "mdi:webcam",
            name: "Meeting mode",
          },
          windows_open: {
            icon: "mdi:window-closed",
            name: "Windows open",
          },
        },
      },
    }),
    MQTTModule,
    ServerModule,
  ],
  providers: [AllRooms, Kitchen, LivingRoom, Loft, Bedroom, Office],
})
export class HomeAutomationModule {
  constructor(
    private readonly socket: SocketManagerService,
    private readonly logger: AutoLogService,
    private readonly config: PushEntityConfigService,
  ) {}

  protected async onApplicationBootstrap() {
    await this.socket.connect();
  }

  /**
   * ? Un-comment to update yaml entities
   */
  protected async onPostInit() {
    // setTimeout(async () => {
    //   this.logger.warn("REBUILD");
    //   await this.config.rebuild();
    // }, 2500);
  }
}
