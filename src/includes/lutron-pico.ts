import { SequenceWatcher } from "@digital-alchemy/automation-logic";

type PicoEvent = {
  action: "press" | "release";
  area_name: string;
  button_number: number;
  button_type: "off";
  device_id: PicoIds;
  device_name: string;
  leap_button_number: number;
  serial: number;
  type: string;
};

enum PicoIds {
  bedroom = "b3d85455702ca9f8da158ad530e19aa7",
  bed = "f2aebfc943e4ed4f86936d0545cd0e60",
  loft = "68f4271ed5041a7072b839fe7726fd05",
  office = "ebdc303ec1cb7c44459441fc694e1d33",
  office1 = "732e1df4bcdcd6255be20d729c7c359f",
  garage = "c57f1e195df43c7a1721d2ff654e1345",
  games = "e5ba3501e60d5c74e76033bbfc297df1",
  living = "e9d176254b6d9b9e7d8aa06aa74c7d8f",
}

export enum Buttons {
  lower = "lower",
  stop = "stop",
  on = "on",
  off = "off",
  raise = "raise",
}

function LutronPicoSequenceMatcher(target_device: PicoIds) {
  return function (match: `${Buttons}`[]) {
    return SequenceWatcher({
      // eslint-disable-next-line spellcheck/spell-checker
      event_type: "lutron_caseta_button_event",
      filter: ({ action, device_id }: PicoEvent) =>
        action === "press" && device_id === target_device,
      match,
      path: "button_type",
    });
  };
}
export const BedroomPico = LutronPicoSequenceMatcher(PicoIds.bedroom);
export const BedPico = LutronPicoSequenceMatcher(PicoIds.bed);
export const LoftPico = LutronPicoSequenceMatcher(PicoIds.loft);
export const OfficePico = LutronPicoSequenceMatcher(PicoIds.office);
export const Office1Pico = LutronPicoSequenceMatcher(PicoIds.office1);
export const GaragePico = LutronPicoSequenceMatcher(PicoIds.garage);
export const GamesPico = LutronPicoSequenceMatcher(PicoIds.games);
export const LivingPico = LutronPicoSequenceMatcher(PicoIds.living);
