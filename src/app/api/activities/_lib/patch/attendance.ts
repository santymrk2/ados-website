import { and, eq, inArray } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import { prevEquiposSchema, validate } from "@/lib/validation";
import * as schema from "@/lib/schema";
import { ensureSingleActivityParticipant, getActiveTeams, isActiveTeam } from "../helpers";
import { canonicalTeams, staleConflict } from "./shared";
import type { PatchHandler } from "./types";

export const attendance: PatchHandler = async ({ tx, activityId, data }) => {
  const { participantId, value } = data;
  if (value) {
    await ensureSingleActivityParticipant(tx, activityId, participantId);
  } else {
    await tx
      .delete(schema.activityParticipants)
      .where(
        and(
          eq(schema.activityParticipants.activityId, activityId),
          eq(schema.activityParticipants.participantId, participantId),
        ),
      );
    await tx
      .delete(schema.goles)
      .where(
        and(
          eq(schema.goles.activityId, activityId),
          eq(schema.goles.participantId, participantId),
        ),
      );
    await tx
      .delete(schema.extras)
      .where(
        and(
          eq(schema.extras.activityId, activityId),
          eq(schema.extras.participantId, participantId),
        ),
      );
  }
};

export const puntuales: PatchHandler = async ({ tx, activityId, data }) => {
  const { participantId, value } = data;
  if (value) {
    await ensureSingleActivityParticipant(tx, activityId, participantId);
  }
  await tx
    .update(schema.activityParticipants)
    .set({ esPuntual: value })
    .where(
      and(
        eq(schema.activityParticipants.activityId, activityId),
        eq(schema.activityParticipants.participantId, participantId),
      ),
    );
};

export const biblias: PatchHandler = async ({ tx, activityId, data }) => {
  const { participantId, value } = data;
  if (value) {
    await ensureSingleActivityParticipant(tx, activityId, participantId);
  }
  await tx
    .update(schema.activityParticipants)
    .set({ tieneBiblia: value })
    .where(
      and(
        eq(schema.activityParticipants.activityId, activityId),
        eq(schema.activityParticipants.participantId, participantId),
      ),
    );
};

export const team: PatchHandler = async ({ tx, activityId, data }) => {
  const { participantId, team } = data;
  if (team) {
    const [activity] = await tx
      .select({ cantEquipos: schema.activities.cantEquipos })
      .from(schema.activities)
      .where(eq(schema.activities.id, activityId));

    if (!activity) throw new AppError("Actividad no encontrada");
    if (!isActiveTeam(team, activity?.cantEquipos)) throw new AppError("Equipo no habilitado para esta actividad");

    await ensureSingleActivityParticipant(tx, activityId, participantId);
  }
  await tx
    .update(schema.activityParticipants)
    .set({ equipo: team })
    .where(
      and(
        eq(schema.activityParticipants.activityId, activityId),
        eq(schema.activityParticipants.participantId, participantId),
      ),
    );
};

export const socials: PatchHandler = async ({ tx, activityId, data }) => {
  const { participantId, value } = data;
  if (value) {
    await ensureSingleActivityParticipant(tx, activityId, participantId);
    const juegos = await tx
      .select({ id: schema.juegos.id })
      .from(schema.juegos)
      .where(eq(schema.juegos.activityId, activityId));
    if (juegos.length > 0) {
      await tx
        .delete(schema.juegoPosiciones)
        .where(
          and(
            eq(schema.juegoPosiciones.participantId, participantId),
            inArray(schema.juegoPosiciones.juegoId, juegos.map((j: { id: number }) => j.id)),
          ),
        );
    }
  }
  await tx
    .update(schema.activityParticipants)
    .set({ esSocial: value, equipo: null })
    .where(
      and(
        eq(schema.activityParticipants.activityId, activityId),
        eq(schema.activityParticipants.participantId, participantId),
      ),
    );
};

export const teams_bulk: PatchHandler = async ({ tx, activityId, data, version }) => {
  const prevEquipos = validate(prevEquiposSchema, data.prevEquipos);
  if (!prevEquipos.success) throw new AppError(prevEquipos.error, 400);

  const [activity] = await tx
    .select({ cantEquipos: schema.activities.cantEquipos })
    .from(schema.activities)
    .where(eq(schema.activities.id, activityId));

  if (!activity) throw new AppError("Actividad no encontrada");

  // Compare-and-set against the current assignments (activity row already locked
  // by the version bump). Clients without prevEquipos skip the check.
  if (prevEquipos.data) {
    const rows = await tx
      .select({ participantId: schema.activityParticipants.participantId, equipo: schema.activityParticipants.equipo })
      .from(schema.activityParticipants)
      .where(eq(schema.activityParticipants.activityId, activityId));
    const current: Record<string, string> = {};
    for (const row of rows) {
      if (isActiveTeam(row.equipo, activity.cantEquipos)) current[row.participantId] = row.equipo as string;
    }
    if (canonicalTeams(current) !== canonicalTeams(prevEquipos.data)) staleConflict(version);
  }

  const activeTeams = getActiveTeams(activity.cantEquipos);
  const equipos = data.equipos || {};
  const entries = Object.entries(equipos).filter(
    ([, team]) => typeof team === "string" && activeTeams.includes(team),
  );

  await tx
    .update(schema.activityParticipants)
    .set({ equipo: null })
    .where(eq(schema.activityParticipants.activityId, activityId));

  for (const [participantId, team] of entries) {
    const numericParticipantId = Number(participantId);
    if (!numericParticipantId) continue;

    const rows = await tx
      .select()
      .from(schema.activityParticipants)
      .where(
        and(
          eq(schema.activityParticipants.activityId, activityId),
          eq(schema.activityParticipants.participantId, numericParticipantId),
        ),
      );

    if (rows.length === 0) {
      await tx.insert(schema.activityParticipants).values({
        activityId,
        participantId: numericParticipantId,
        equipo: team as string,
      });
      continue;
    }

    await tx
      .update(schema.activityParticipants)
      .set({ equipo: team as string, esSocial: false })
      .where(
        and(
          eq(schema.activityParticipants.activityId, activityId),
          eq(schema.activityParticipants.participantId, numericParticipantId),
        ),
      );
  }
};
