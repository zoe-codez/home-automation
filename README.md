# @digital-alchemy example repository

This is a minimal example repository, intended as a proof of concept that lives outside the [primary monorepo](https://github.com/zoe-codez/digital-alchemy).

## Try it out

### Install

```bash
git clone https://github.com/zoe-codez/app-base.git
cd ./quickscript
yarn
```

### Run dev server

```bash
yarn start
```

### Build and run

```bash
# build code
yarn build

# will accept switches, same as above
node build/src/main.js
```

## Setup

### Installing Node

`@digital-alchemy` targets node16+, with node18 being preferred.
If you do not have it installed, [fnm](https://github.com/Schniz/fnm) can do that for you.

### Upgrading dependencies

All versions of `@digital-alchemy/*` should match. The command `yarn da:update` will upgrade everything to latest.

### Configuration

The script will accept configurations from:

- command line switches
- environment variables
- file based configurations

The file based configurations are great for long term peristent configurations.
The recommended locations for these files is `~/.config/{app-name}` or `./.{app-name}rc`, in ini format.

## Bug reports & issues

Issues with `@digital-alchemy` libraries should be opened against the primary monorepo
