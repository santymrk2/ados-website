import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import * as schema from "@/lib/schema";
import { configPrevSchema, configUpdateSchema, validate } from "@/lib/validation";
import { normalizeInactiveTeamData } from "../helpers";
import { ALLOWED_CONFIG_KEYS, type AllowedConfigKey } from "../types";
import { staleConflict } from "./shared";
import type { PatchContext, PatchHandler } from "./types";

type ConfigField = "locked" | "titulo" | "cantEquipos" | "fecha";

function normalizeConfig(k: ConfigField, v: unknown) {
  if (k === "locked") return Boolean(v);
  if (k === "cantEquipos") return Number(v);
  return String(v ?? "");
}

// Compare-and-set on the config fields only: 409 when any field the client based
// its edit on changed meanwhile. The activity row is already locked by the
// version bump in the PATCH dispatcher.
async function assertConfigUnchanged({ tx, activityId, version }: PatchContext, prev: Partial<Record<ConfigField, unknown>>) {
  const fields = Object.keys(prev) as ConfigField[];
  if (fields.length === 0) return;
  const [current] = await tx
    .select({
      locked: schema.activities.locked,
      titulo: schema.activities.titulo,
      cantEquipos: schema.activities.cantEquipos,
      fecha: schema.activities.fecha,
    })
    .from(schema.activities)
    .where(eq(schema.activities.id, activityId));
  if (!current) throw new AppError("Actividad no encontrada", 404);
  if (fields.some((k) => normalizeConfig(k, current[k]) !== normalizeConfig(k, prev[k]))) staleConflict(version);
}

export const config: PatchHandler = async (ctx) => {
  const { tx, activityId, data } = ctx;
  const validation = validate(configUpdateSchema, { id: activityId, data });
  if (!validation.success) throw new AppError(validation.error, 400);
  const { k, v, prev } = validation.data.data;
  if (!ALLOWED_CONFIG_KEYS.includes(k as AllowedConfigKey)) {
    console.warn(`[SECURITY] Blocked attempt to set disallowed config key: ${k}`);
    throw new AppError("Clave de configuración no permitida");
  }
  if (prev !== undefined) await assertConfigUnchanged(ctx, { [k]: prev });

  await tx
    .update(schema.activities)
    .set({ [k]: v })
    .where(eq(schema.activities.id, activityId));

  if (k === "cantEquipos") {
    await normalizeInactiveTeamData(tx, activityId, Number(v));
  }
};

export const config_bulk: PatchHandler = async (ctx) => {
  const { tx, activityId, data } = ctx;
  const prev = validate(configPrevSchema, data.prev);
  if (!prev.success) throw new AppError(prev.error, 400);
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
  if (prev.data) await assertConfigUnchanged(ctx, prev.data);

  await tx
    .update(schema.activities)
    .set(updates)
    .where(eq(schema.activities.id, activityId));

  if (updates.cantEquipos) {
    await normalizeInactiveTeamData(tx, activityId, updates.cantEquipos);
  }
};
