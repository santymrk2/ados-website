import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import * as schema from "@/lib/schema";
import { INDIVIDUAL_GAME_MARKER, getActiveTeams } from "../helpers";
import { assertGameInActivity, inActivity } from "./shared";
import type { PatchHandler } from "./types";

export const game_add: PatchHandler = async ({ tx, activityId, data }) => {
  const [game] = await tx
    .insert(schema.juegos)
    .values({
      activityId,
      nombre: data.nombre || "",
      tipo: data.tipo || "grupal",
    })
    .returning({ id: schema.juegos.id });

  if (data.tipo === "individual") {
    await tx.insert(schema.juegoPosiciones).values({
      juegoId: game.id,
      equipo: INDIVIDUAL_GAME_MARKER,
      posicion: 0,
    });
  }

  return { id: game.id };
};

export const game_update: PatchHandler = async ({ tx, activityId, data }) => {
  const { id, nombre } = data;
  await tx
    .update(schema.juegos)
    .set({ nombre })
    .where(inActivity.juegos(id, activityId));
};

export const game_delete: PatchHandler = async ({ tx, activityId, data }) => {
  await assertGameInActivity(tx, activityId, data.id);
  await tx
    .delete(schema.juegoPosiciones)
    .where(eq(schema.juegoPosiciones.juegoId, data.id));
  await tx.delete(schema.juegos).where(eq(schema.juegos.id, data.id));
};

export const game_pos: PatchHandler = async ({ tx, activityId, data }) => {
  const { juegoId, pos } = data;
  if (!juegoId || !pos) throw new AppError("Datos inválidos: juegoId y pos son requeridos");
  await assertGameInActivity(tx, activityId, juegoId);

  const [activity] = await tx
    .select({ cantEquipos: schema.activities.cantEquipos })
    .from(schema.activities)
    .where(eq(schema.activities.id, activityId));

  if (!activity) throw new AppError("Actividad no encontrada");

  const activeTeams = getActiveTeams(activity.cantEquipos);
  const existingPositions = await tx
    .select({
      equipo: schema.juegoPosiciones.equipo,
      posicion: schema.juegoPosiciones.posicion,
      participantId: schema.juegoPosiciones.participantId,
    })
    .from(schema.juegoPosiciones)
    .where(eq(schema.juegoPosiciones.juegoId, juegoId));

  const isIndividualGame = existingPositions.some(
    (row) => row.posicion === 0 && row.equipo === INDIVIDUAL_GAME_MARKER,
  );

  // Delete all existing positions first, then bulk insert the new set.
  // No need for onConflictDoUpdate — rows were just deleted.
  await tx
    .delete(schema.juegoPosiciones)
    .where(eq(schema.juegoPosiciones.juegoId, juegoId));

  if (isIndividualGame) {
    const rows: { juegoId: number; participantId?: number; equipo?: string; posicion: number }[] = [
      { juegoId, equipo: INDIVIDUAL_GAME_MARKER, posicion: 0 },
    ];
    const seenPIds = new Set<number>();

    for (const [posStr, pIds] of Object.entries(pos)) {
      const posicion = Number(posStr);
      if (posicion < 1 || !Array.isArray(pIds)) continue;

      for (const pidStr of pIds) {
        const participantId = Number(pidStr);
        if (!Number.isFinite(participantId) || participantId < 1) continue;
        if (seenPIds.has(participantId)) continue;
        seenPIds.add(participantId);
        rows.push({ juegoId, participantId, posicion });
      }
    }

    await tx.insert(schema.juegoPosiciones).values(rows);
  } else {
    const rows: { juegoId: number; equipo: string; posicion: number }[] = [];
    const seenTeams = new Set<string>();

    for (const [posStr, equipos] of Object.entries(pos)) {
      const posicion = Number(posStr);
      if (posicion < 1 || posicion > activeTeams.length) {
        throw new AppError("Posición inválida para la cantidad de equipos");
      }
      if (!Array.isArray(equipos)) continue;

      for (const eqName of equipos) {
        if (typeof eqName !== "string") continue;
        if (!activeTeams.includes(eqName)) {
          throw new AppError("Equipo no habilitado para esta actividad");
        }
        if (!seenTeams.has(eqName)) {
          seenTeams.add(eqName);
          rows.push({ juegoId, equipo: eqName, posicion });
        }
      }
    }

    if (rows.length > 0) {
      await tx.insert(schema.juegoPosiciones).values(rows);
    }
  }
};
