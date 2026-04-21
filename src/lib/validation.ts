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

/**
 * Participant schemas
 */
export const participantSchema = z.object({
  nombre: stringSchema.min(1),
  apellido: stringSchema.min(1),
  fechaNacimiento: z.string().optional().nullable(),
  sexo: z.enum(["M", "F"]),
  foto: optionalStringSchema,
  fotoAltaCalidad: optionalStringSchema,
  invitadosPor: z.number().optional().nullable(),
});

export const participantInputSchema = participantSchema.extend({
  id: z.number().optional(),
});

/**
 * Activity schemas
 */
export const activitySchema = z.object({
  fecha: stringSchema,
  titulo: optionalStringSchema,
  cantEquipos: z.number().min(2).max(10).default(4),
  locked: z.boolean().default(false),
  version: z.number().default(1),
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
  }),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  password: stringSchema.min(1),
  role: z.enum(["admin", "viewer"]).optional(),
});

/**
 * Push subscription schema
 */
export const pushSubscriptionSchema = z.object({
  participantId: z.number().positive(),
  endpoint: stringSchema.url(),
  p256dh: stringSchema,
  auth: stringSchema,
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