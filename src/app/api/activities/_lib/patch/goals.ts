import { and, eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import * as schema from "@/lib/schema";
import { assertTeamEnabled, inActivity } from "./shared";
import type { PatchHandler } from "./types";

export const goal_add: PatchHandler = async ({ tx, activityId, data }) => {
  if (data.team) {
    await assertTeamEnabled(tx, activityId, data.team);
  }

  const [goal] = await tx
    .insert(schema.goles)
    .values({
      activityId,
      participantId: data.pid,
      tipo: data.tipo,
      cant: data.cant || 1,
      team: data.team || null,
      matchId: data.matchId || null,
    })
    .returning({ id: schema.goles.id });

  return { id: goal.id };
};

export const goal_remove: PatchHandler = async ({ tx, activityId, data }) => {
  if (data.id) {
    await tx.delete(schema.goles).where(inActivity.goles(data.id, activityId));
    return;
  }

  if (!data.pid) throw new AppError("ID de participante requerido", 400);
  const participantId = data.pid;

  const existing = await tx
    .select()
    .from(schema.goles)
    .where(
      and(
        eq(schema.goles.activityId, activityId),
        eq(schema.goles.participantId, participantId),
        eq(schema.goles.tipo, data.tipo),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    await tx.delete(schema.goles).where(eq(schema.goles.id, existing[0].id));
  }
};

export const goal_update: PatchHandler = async ({ tx, activityId, data }) => {
  const { id, pid, tipo, cant } = data;
  const updateData: Partial<{
    participantId: number | null;
    tipo: string;
    cant: number;
  }> = {};
  if (pid !== undefined) updateData.participantId = pid;
  if (tipo !== undefined) updateData.tipo = tipo;
  if (cant !== undefined) updateData.cant = cant;

  await tx
    .update(schema.goles)
    .set(updateData)
    .where(inActivity.goles(id, activityId));
};
