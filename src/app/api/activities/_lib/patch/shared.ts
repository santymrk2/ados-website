import { and, eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import * as schema from "@/lib/schema";
import { isActiveTeam } from "../helpers";
import type { Tx } from "../types";
import type { PatchContext } from "./types";

// Row-level edits must only touch rows of the activity whose lock/version was checked
export const inActivity = {
  extras: (id: number, activityId: number) => and(eq(schema.extras.id, id), eq(schema.extras.activityId, activityId)),
  goles: (id: number, activityId: number) => and(eq(schema.goles.id, id), eq(schema.goles.activityId, activityId)),
  juegos: (id: number, activityId: number) => and(eq(schema.juegos.id, id), eq(schema.juegos.activityId, activityId)),
  partidos: (id: number, activityId: number) => and(eq(schema.partidos.id, id), eq(schema.partidos.activityId, activityId)),
  invitaciones: (id: number, activityId: number) =>
    and(eq(schema.invitaciones.id, id), eq(schema.invitaciones.activityId, activityId)),
};

export async function assertGameInActivity(tx: Tx, activityId: number, juegoId: number, { forUpdate = false } = {}) {
  const query = tx
    .select({ id: schema.juegos.id, tipo: schema.juegos.tipo })
    .from(schema.juegos)
    .where(inActivity.juegos(juegoId, activityId));
  const [game] = forUpdate ? await query.for("update") : await query;
  if (!game) throw new AppError("Juego no encontrado en esta actividad", 404);
  return game;
}

export async function assertTeamEnabled(tx: Tx, activityId: number, team: string) {
  const [activity] = await tx
    .select({ cantEquipos: schema.activities.cantEquipos })
    .from(schema.activities)
    .where(eq(schema.activities.id, activityId));

  if (!activity || !isActiveTeam(team, activity.cantEquipos)) {
    throw new AppError("Equipo no habilitado para esta actividad");
  }
}

/** Compare-and-set failure: the resource no longer matches the base the client edited. */
export function staleConflict(bumpedVersion: number): never {
  // Throwing rolls back this PATCH's bump, so the stored version is the previous one
  throw new AppError("Otro usuario modificó este dato. Se actualizó la vista.", 409, { currentVersion: bumpedVersion - 1 });
}

/** Requests without prev* (older clients) keep the old activity-version lock. */
export function assertClientVersion({ version, clientVersion }: PatchContext) {
  if (clientVersion !== version - 1) staleConflict(version);
}

/** Order-insensitive fingerprint of a positions map (position -> teams/participant ids). */
export function canonicalPos(pos: Record<string, unknown[]>) {
  return JSON.stringify(
    Object.entries(pos)
      .map(([k, list]) => [String(Number(k)), (list || []).map(String).sort()] as const)
      .filter(([, list]) => list.length > 0)
      .sort(([a], [b]) => Number(a) - Number(b)),
  );
}

/** Order-insensitive fingerprint of a participant -> team map (empty teams ignored). */
export function canonicalTeams(equipos: Record<string, string | null | undefined>) {
  return JSON.stringify(
    Object.entries(equipos)
      .filter(([, team]) => typeof team === "string" && team.length > 0)
      .map(([pid, team]) => [String(Number(pid)), team] as const)
      .sort(([a], [b]) => Number(a) - Number(b)),
  );
}
