import { config, config_bulk } from "./config";
import { attendance, biblias, puntuales, socials, team, teams_bulk } from "./attendance";
import { goal_add, goal_remove, goal_update } from "./goals";
import { extra_add, extra_delete, extra_toggle, extra_update } from "./extras";
import { game_add, game_delete, game_pos, game_update } from "./games";
import { partido_add, partido_delete, partido_update } from "./matches";
import { invitacion_add, invitacion_delete, invitacion_update } from "./invitations";
import type { PatchHandler } from "./types";

const patchHandlers: Record<string, PatchHandler> = {
  config,
  config_bulk,
  attendance,
  puntuales,
  biblias,
  team,
  socials,
  teams_bulk,
  goal_add,
  goal_remove,
  goal_update,
  extra_update,
  extra_toggle,
  extra_add,
  extra_delete,
  game_add,
  game_update,
  game_delete,
  game_pos,
  partido_add,
  partido_update,
  partido_delete,
  invitacion_add,
  invitacion_update,
  invitacion_delete,
};

export function getPatchHandler(type: string): PatchHandler | undefined {
  return Object.hasOwn(patchHandlers, type) ? patchHandlers[type] : undefined;
}
