import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import * as schema from "@/lib/schema";
import { configUpdateSchema, validate } from "@/lib/validation";
import { normalizeInactiveTeamData } from "../helpers";
import { ALLOWED_CONFIG_KEYS, type AllowedConfigKey } from "../types";
import type { PatchHandler } from "./types";

export const config: PatchHandler = async ({ tx, activityId, data }) => {
  const validation = validate(configUpdateSchema, { id: activityId, data });
  if (!validation.success) throw new AppError(validation.error, 400);
  const { k, v } = validation.data.data;
  if (!ALLOWED_CONFIG_KEYS.includes(k as AllowedConfigKey)) {
    console.warn(`[SECURITY] Blocked attempt to set disallowed config key: ${k}`);
    throw new AppError("Clave de configuración no permitida");
  }

  await tx
    .update(schema.activities)
    .set({ [k]: v })
    .where(eq(schema.activities.id, activityId));

  if (k === "cantEquipos") {
    await normalizeInactiveTeamData(tx, activityId, Number(v));
  }
};

export const config_bulk: PatchHandler = async ({ tx, activityId, data }) => {
  const updates: Partial<{
    locked: boolean;
    titulo: string;
    cantEquipos: number;
    fecha: string;
  }> = {};

  if ("locked" in data) updates.locked = !!data.locked;
  if ("titulo" in data) updates.titulo = String(data.titulo || "");
  if ("fecha" in data) updates.fecha = String(data.fecha || "");
  if ("cantEquipos" in data) {
    const cantEquipos = Number(data.cantEquipos);
    if (![2, 4, 6].includes(cantEquipos)) throw new AppError("Cantidad de equipos inválida");
    updates.cantEquipos = cantEquipos;
  }

  if (Object.keys(updates).length === 0) throw new AppError("No hay cambios de configuración");

  await tx
    .update(schema.activities)
    .set(updates)
    .where(eq(schema.activities.id, activityId));

  if (updates.cantEquipos) {
    await normalizeInactiveTeamData(tx, activityId, updates.cantEquipos);
  }
};
