import * as refresh from "./refresh";
import * as play from "./play";
import * as roll from "./roll";
import * as buildFacility from "./build-facility";
import * as mapRoles from "./map-roles";
import * as destroyFacility from "./destroy-facility";
import * as reset from "./reset";
import * as run from "./run";

export const commands = {
  refresh,
  play,
  roll,
  "build-facility": buildFacility,
  "map-roles": mapRoles,
  "destroy-facility": destroyFacility,
  reset,
  run,
};
export const autoCompleteCommands = {
  "destroy-facility": destroyFacility,
  run,
};
