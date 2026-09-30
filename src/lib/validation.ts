/**
 * Zod Validation Schemas
 * Centralized input validation for API routes
 */

import { z } from "zod";

/**
 * Common schemas
 */
export const stringSchema = z.string().min(1);

export const optionalStringSchema = z.string().optional();

export const MAX_IMAGE_DATA_URL_LENGTH = 12 * 1024 * 1024;

const roleSchema = z.enum(["admin", "viewer"]);
const imageReferenceSchema = z
  .string()
  .max(MAX_IMAGE_DATA_URL_LENGTH, { error: "La imagen es demasiado grande" })
  .optional()
  .nullable();

/**
 * Participant schemas
 */
export const participantSchema = z.object({
  nombre: stringSchema.min(1),
  apellido: stringSchema.min(1),
  fechaNacimiento: z.string().optional().nullable(),
  sexo: z.enum(["M", "F"]),
  telefono: z.string().optional().nullable(),
  foto: imageReferenceSchema,
  fotoAltaCalidad: imageReferenceSchema,
  invitadoPor: z.number().int().positive().optional().nullable(),
});

export const participantInputSchema = participantSchema.extend({
  id: z.number().int().positive().optional(),
});

export const participantSaveSchema = z.object({
  data: participantInputSchema,
  isNew: z.boolean(),
  invitadorId: z.number().int().positive().optional().nullable(),
});

export const deleteByIdSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Activity schemas
 */
export const activitySchema = z.object({
  fecha: stringSchema,
  titulo: optionalStringSchema,
  cantEquipos: z.number().int().min(2).max(10).default(4),
  locked: z.boolean().default(false),
  version: z.number().int().positive().default(1),
});

export const activitySaveSchema = z.object({
  data: activitySchema.extend({
    id: z.number().int().positive().optional(),
  }).passthrough(),
  isNew: z.boolean(),
});

export const activityPatchSchema = z.object({
  activityId: z.number().int().positive(),
  type: stringSchema,
  data: z.record(z.string(), z.unknown()),
  version: z.number().int().positive().optional(),
});

/**
 * Config update schema - WITH WHITELIST to prevent SQL column injection
 */
const configKeysSchema = z.enum([
  "locked",
  "titulo",
  "cantEquipos",
  "fecha",
]);

export const configUpdateSchema = z.object({
  id: z.number().positive(),
  data: z.object({
    k: configKeysSchema,
    v: z.union([z.boolean(), z.string(), z.number()]),
    // Compare-and-set base: value of `k` the edit was based on (optional for older clients)
    prev: z.union([z.boolean(), z.string(), z.number()]).optional(),
  }),
});

/** Compare-and-set bases sent with whole-state PATCH types (optional for older clients). */
export const configPrevSchema = z
  .object({ locked: z.boolean(), titulo: z.string(), fecha: z.string(), cantEquipos: z.number() })
  .partial()
  .optional();
export const prevPosSchema = z.record(z.string(), z.array(z.union([z.string(), z.number()]))).optional();
export const prevEquiposSchema = z.record(z.string(), z.string().nullable()).optional();

/**
 * Login schema
 */
export const loginSchema = z.object({
  password: stringSchema.min(1),
  role: roleSchema.optional(),
});

/**
 * Push subscription schema
 */
export const pushSubscriptionSchema = z.object({
  participantId: z.number().int().positive().optional().nullable(),
  endpoint: z.url(),
  p256dh: stringSchema,
  auth: stringSchema,
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.url(),
});

export const subscriptionActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("subscribe"),
    participantId: z.number().int().positive().optional().nullable(),
    endpoint: z.url(),
    p256dh: stringSchema,
    auth: stringSchema,
  }),
  z.object({
    action: z.literal("unsubscribe"),
    endpoint: z.url(),
  }),
  z.object({
    action: z.literal("delete_all"),
  }),
]);

export const notificationTriggerSchema = z.object({
  action: z.literal("send_birthday_notifications"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Fecha inválida" })
    .optional()
    .nullable(),
});

/**
 * Utility to validate and return errors
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const firstError = result.error.issues[0];
  return {
    success: false,
    error: firstError ? `${firstError.path.join(".")}: ${firstError.message}` : "Datos inválidos",
  };
}

/**
 * Team display settings (name + color per team id E1..E6).
 * Team ids never change: names/colors are display-only.
 */
const teamIdSchema = z.enum(["E1", "E2", "E3", "E4", "E5", "E6"], { error: "Equipo inválido" });
export const teamDisplayEntrySchema = z.object({
  name: z.string().trim().min(1, { error: "El nombre no puede estar vacío" }).max(24).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "Color inválido" }).optional(),
});
export const teamDisplaySettingsSchema = z.partialRecord(teamIdSchema, teamDisplayEntrySchema, {
  error: (issue) => (issue.code === "invalid_key" ? "Equipo inválido" : undefined),
});
export const teamDefaultsUpdateSchema = z.object({ teams: teamDisplaySettingsSchema });
