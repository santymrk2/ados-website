import { and, eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import * as schema from "@/lib/schema";
import { isActiveTeam } from "../helpers";
import type { Tx } from "../types";

// Row-level edits must only touch rows of the activity whose lock/version was checked
export const inActivity = {
  extras: (id: number, activityId: number) => and(eq(schema.extras.id, id), eq(schema.extras.activityId, activityId)),
  goles: (id: number, activityId: number) => and(eq(schema.goles.id, id), eq(schema.goles.activityId, activityId)),
  juegos: (id: number, activityId: number) => and(eq(schema.juegos.id, id), eq(schema.juegos.activityId, activityId)),
  partidos: (id: number, activityId: number) => and(eq(schema.partidos.id, id), eq(schema.partidos.activityId, activityId)),
  invitaciones: (id: number, activityId: number) =>
    and(eq(schema.invitaciones.id, id), eq(schema.invitaciones.activityId, activityId)),
};

export async function assertGameInActivity(tx: Tx, activityId: number, juegoId: number) {
  const [game] = await tx.select({ id: schema.juegos.id }).from(schema.juegos).where(inActivity.juegos(juegoId, activityId));
  if (!game) throw new AppError("Juego no encontrado en esta actividad", 404);
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
