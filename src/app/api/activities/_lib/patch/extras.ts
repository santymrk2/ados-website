import { and, eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { assertTeamEnabled, inActivity } from "./shared";
import type { PatchHandler } from "./types";

export const extra_update: PatchHandler = async ({ tx, activityId, data }) => {
  const { id, pid, team, puntos, motivo } = data;
  if (team) {
    await assertTeamEnabled(tx, activityId, team);
  }

  const updateData: Partial<{
    participantId: number | null;
    team: string | null;
    puntos: number;
    motivo: string | null;
  }> = {};
  if (pid !== undefined) updateData.participantId = pid;
  if (team !== undefined) updateData.team = team;
  if (puntos !== undefined) updateData.puntos = puntos;
  if (motivo !== undefined) updateData.motivo = motivo;

  await tx
    .update(schema.extras)
    .set(updateData)
    .where(inActivity.extras(id, activityId));
};

export const extra_toggle: PatchHandler = async ({ tx, activityId, data }) => {
  const { participantId, tipo, puntos, value } = data;
  if (value) {
    await tx.insert(schema.extras).values({
      activityId,
      participantId,
      tipo,
      puntos,
    });
  } else {
    await tx
      .delete(schema.extras)
      .where(
        and(
          eq(schema.extras.activityId, activityId),
          eq(schema.extras.participantId, participantId),
          eq(schema.extras.tipo, tipo),
        ),
      );
  }
};

export const extra_add: PatchHandler = async ({ tx, activityId, data }) => {
  if (data.team) {
    await assertTeamEnabled(tx, activityId, data.team);
  }

  const [extra] = await tx
    .insert(schema.extras)
    .values({
      activityId,
      participantId: data.pid || null,
      team: data.team || null,
      tipo: data.tipo || "extra",
      puntos: data.puntos || 0,
      motivo: data.motivo || "",
    })
    .returning();

  return { ...extra };
};

export const extra_delete: PatchHandler = async ({ tx, activityId, data }) => {
  const { id } = data;
  await tx.delete(schema.extras).where(inActivity.extras(id, activityId));
};
