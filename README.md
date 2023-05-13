# [@digital-alchemy](https://github.com/zoe-codez/digital-alchemy) example automations

This repo contains an example home automation setup based off `@digital-alchemy` libraries.
The code is based off an actual running setup, and may not necessarily do things optimally due to context that isn't provided here / historical.

It is not intended to run as-is, but acts as reference code and potential starting point for your own setup

## Custom type definitions

Running `yarn types` will rebuild the dynamic types used in the home automation libraries.
Use the [.hass-type-generaterc](./.hass-type-generaterc) file to configure which Home Assistant instance is pulled from

Application created yaml definitions are managed from the [main application module](./src/modules/home-automation.module.ts)

### Run dev server

```bash
yarn start
```
