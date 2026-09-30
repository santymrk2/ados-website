import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { TEAMS } from "@/lib/constants";
import type { ActivityParticipantRow, Tx } from "./types";

export function getActiveTeams(cantEquipos: number | null | undefined) {
  return TEAMS.slice(0, cantEquipos || 4);
}

export const INDIVIDUAL_GAME_MARKER = "__individual__";

export function isActiveTeam(team: string | null | undefined, cantEquipos: number | null | undefined) {
  return !!team && getActiveTeams(cantEquipos).includes(team);
}

function getMergedParticipantRow(rows: ActivityParticipantRow[]) {
  const sorted = [...rows].sort((a, b) => a.id - b.id);
  const keeper = sorted[0];
  if (!keeper) {
    throw new Error("No hay filas de asistencia para combinar");
  }
  const hasSocial = sorted.some((row) => !!row.esSocial);

  return {
    keeper,
    updates: {
      equipo: hasSocial ? null : sorted.find((row) => !!row.equipo)?.equipo ?? null,
      esPuntual: sorted.some((row) => !!row.esPuntual),
      tieneBiblia: sorted.some((row) => !!row.tieneBiblia),
      esSocial: hasSocial,
    },
    duplicateIds: sorted.slice(1).map((row) => row.id),
  };
}

export async function ensureSingleActivityParticipant(tx: Tx, activityId: number, participantId: number) {
    const rows = await tx
      .select()
      .from(schema.activityParticipants)
      .where(
        and(
          eq(schema.activityParticipants.activityId, activityId),
          eq(schema.activityParticipants.participantId, participantId),
        ),
      );

    if (rows.length === 0) {
      await tx.insert(schema.activityParticipants).values({ activityId, participantId });
      return;
    }

    if (rows.length === 1) return;

    const { keeper, updates, duplicateIds } = getMergedParticipantRow(rows);

    await tx
      .update(schema.activityParticipants)
      .set(updates)
      .where(eq(schema.activityParticipants.id, keeper.id));

    await tx
      .delete(schema.activityParticipants)
      .where(inArray(schema.activityParticipants.id, duplicateIds));
}

export async function normalizeInactiveTeamData(tx: Tx, activityId: number, cantEquipos: number) {
  const activeTeams = getActiveTeams(cantEquipos);
  const inactiveTeams = TEAMS.filter((team) => !activeTeams.includes(team));
  const allJuegos = await tx
    .select()
    .from(schema.juegos)
    .where(eq(schema.juegos.activityId, activityId));
  const juegoIds = allJuegos.map((juego) => juego.id);
    if (inactiveTeams.length > 0) {
      await tx
        .update(schema.activityParticipants)
        .set({ equipo: null })
        .where(
          and(
            eq(schema.activityParticipants.activityId, activityId),
            inArray(schema.activityParticipants.equipo, inactiveTeams),
          ),
        );
    }

    if (juegoIds.length > 0 && inactiveTeams.length > 0) {
      await tx
        .delete(schema.juegoPosiciones)
        .where(
          and(
            inArray(schema.juegoPosiciones.juegoId, juegoIds),
            inArray(schema.juegoPosiciones.equipo, inactiveTeams),
          ),
        );
    }

    if (juegoIds.length > 0) {
      await tx
        .delete(schema.juegoPosiciones)
        .where(
          and(
            inArray(schema.juegoPosiciones.juegoId, juegoIds),
            gt(schema.juegoPosiciones.posicion, cantEquipos),
            isNull(schema.juegoPosiciones.participantId),
          ),
        );
    }

    if (inactiveTeams.length > 0) {
      await tx
        .delete(schema.extras)
        .where(
          and(
            eq(schema.extras.activityId, activityId),
            inArray(schema.extras.team, inactiveTeams),
          ),
        );

      await tx
        .delete(schema.goles)
        .where(
          and(
            eq(schema.goles.activityId, activityId),
            inArray(schema.goles.team, inactiveTeams),
          ),
        );
    }
}
