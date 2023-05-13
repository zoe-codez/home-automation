// ! Import first
import "./includes/plugins";
import { Bootstrap } from "@digital-alchemy/boilerplate";

import { HomeAutomationModule } from "./modules";

Bootstrap(HomeAutomationModule, {
  logging: {
    prettyLog: {
      prettyOptions: { singleLine: true },
    },
  },
});
