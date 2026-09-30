import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import * as schema from "@/lib/schema";
import type { PatchHandler } from "./types";

export const invitacion_add: PatchHandler = async ({ tx, activityId, data }) => {
  const { invitador, invitadoId } = data;
  if (!invitadoId) throw new AppError("La invitación debe tener un invitado seleccionado");

  const [created] = await tx
    .insert(schema.invitaciones)
    .values({
      activityId,
      invitadorId: invitador || null,
      invitadoId: Number(invitadoId),
    })
    .returning({ id: schema.invitaciones.id });

  return { id: created.id };
};

export const invitacion_update: PatchHandler = async ({ tx, data }) => {
  const { id, invitador, invitadoId } = data;
  if (!id) throw new AppError("ID de invitación requerido");
  if (!invitadoId) throw new AppError("La invitación debe tener un invitado seleccionado");

  await tx
    .update(schema.invitaciones)
    .set({
      invitadorId: invitador ? Number(invitador) : null,
      invitadoId: Number(invitadoId),
    })
    .where(eq(schema.invitaciones.id, id));
};

export const invitacion_delete: PatchHandler = async ({ tx, data }) => {
  const { id } = data;
  if (!id) throw new AppError("ID de invitación requerido");
  await tx.delete(schema.invitaciones).where(eq(schema.invitaciones.id, id));
};
