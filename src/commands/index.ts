import * as refresh from "./refresh";
import * as play from "./play";
import * as roll from "./roll";
import * as buildFacility from "./build-facility";
import * as mapRoles from "./map-roles";
import * as destroyFacility from "./destroy-facility";
import * as reset from "./reset";
import * as run from "./run";
import * as clearRuns from "./clear-runs";
import * as startRun from "./start-run";
import * as alert from "./alert";

export const commands = {
  refresh,
  play,
  roll,
  "build-facility": buildFacility,
  "map-roles": mapRoles,
  "destroy-facility": destroyFacility,
  "clear-runs": clearRuns,
  "start-run": startRun,
  reset,
  run,
  alert,
};
export const autoCompleteCommands = {
  "destroy-facility": destroyFacility,
  run,
};
