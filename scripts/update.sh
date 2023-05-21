#!/bin/bash
npx npm-check-updates -f "@digital-alchemy/*" -u
yarn
npx hass-type-generate
