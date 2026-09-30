import type { db } from "@/lib/db";
import type * as schema from "@/lib/schema";

// Whitelist of allowed keys for config updates - prevents SQL column injection
export const ALLOWED_CONFIG_KEYS = ["locked", "titulo", "cantEquipos", "fecha"] as const;
export type AllowedConfigKey = typeof ALLOWED_CONFIG_KEYS[number];

export type ActivityParticipantRow = typeof schema.activityParticipants.$inferSelect;
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type PositionMap = Record<string, string[]>;

export interface ActivityGamePayload {
  id?: number | string;
  nombre?: string | null;
  tipo?: "grupal" | "individual";
  pos?: PositionMap | null;
}

export interface ActivityMatchPayload {
  id?: number | string;
  deporte?: string | null;
  genero?: string | null;
  eq1: string;
  eq2: string;
  resultado?: string | null;
}

export interface ActivityGoalPayload {
  id?: number;
  pid?: number | null;
  tipo: string;
  cant: number;
  matchId?: number | string | null;
  team?: string | null;
}

export interface ActivityExtraPayload {
  id?: number;
  pid?: number | null;
  team?: string | null;
  puntos: number;
  motivo?: string | null;
}

export interface ActivityInvitationPayload {
  id?: number;
  invitador?: number | null;
  invitadoId?: number | null;
  invitado_id?: number | null;
}

export interface ActivitySavePayload extends Record<string, unknown> {
  id?: number;
  fecha: string;
  titulo?: string | null;
  cantEquipos?: number;
  locked?: boolean;
  version?: number;
  asistentes?: number[];
  equipos?: Record<string, string>;
  puntuales?: number[];
  biblias?: number[];
  socials?: number[];
  juegos?: ActivityGamePayload[];
  partidos?: ActivityMatchPayload[];
  goles?: ActivityGoalPayload[];
  extras?: ActivityExtraPayload[];
  descuentos?: ActivityExtraPayload[];
  invitaciones?: ActivityInvitationPayload[];
}

export interface ActivityPatchPayload extends Record<string, unknown> {
  k: AllowedConfigKey;
  v: boolean | string | number;
  locked?: boolean;
  titulo?: string | null;
  fecha?: string | null;
  cantEquipos?: number | string | null;
  participantId: number;
  value: boolean;
  team: string | null;
  equipos?: Record<string, string>;
  pid: number | null;
  tipo: string;
  cant: number;
  matchId: number | null;
  id: number;
  puntos: number;
  motivo: string | null;
  nombre: string;
  juegoId: number;
  pos: PositionMap;
  deporte: string;
  genero: string;
  eq1: string;
  eq2: string;
  resultado: string | null;
  invitador: number | null;
  invitadoId: number | null;
}
