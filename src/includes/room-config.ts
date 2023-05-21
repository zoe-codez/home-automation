export const AutomationLogicRoomConfig = {
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
};

export type OfficeScenes = Extract<
  keyof typeof AutomationLogicRoomConfig.room_configuration.office.scenes,
  string
>;

export type LoftScenes = Extract<
  keyof typeof AutomationLogicRoomConfig.room_configuration.loft.scenes,
  string
>;

export type BedroomScenes = Extract<
  keyof typeof AutomationLogicRoomConfig.room_configuration.bedroom.scenes,
  string
>;

export type KitchenScenes = Extract<
  keyof typeof AutomationLogicRoomConfig.room_configuration.kitchen.scenes,
  string
>;

export type LivingScenes = Extract<
  keyof typeof AutomationLogicRoomConfig.room_configuration.living.scenes,
  string
>;
