import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import type { PatchHandler } from "./types";

export const partido_add: PatchHandler = async ({ tx, activityId, data }) => {
  await tx.insert(schema.partidos).values({
    activityId,
    deporte: data.deporte,
    genero: data.genero,
    eq1: data.eq1,
    eq2: data.eq2,
    resultado: data.resultado,
  });
};

export const partido_update: PatchHandler = async ({ tx, data }) => {
  await tx
    .update(schema.partidos)
    .set({
      resultado: data.resultado,
      eq1: data.eq1,
      eq2: data.eq2,
      deporte: data.deporte,
      genero: data.genero,
    })
    .where(eq(schema.partidos.id, data.id));
};

export const partido_delete: PatchHandler = async ({ tx, data }) => {
  await tx.delete(schema.goles).where(eq(schema.goles.matchId, data.id));
  await tx.delete(schema.partidos).where(eq(schema.partidos.id, data.id));
};
