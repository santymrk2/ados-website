/**
 * Shared optimistic mutates for activity updates.
 *
 * Each function returns a pure `(act: Activity) => Activity` that patches
 * the local store *before* the server responds. The server call follows,
 * and `optimisticUpdateActivity` handles revert on error.
 *
 * Rules:
 * - Toggle/update/delete on EXISTING rows → optimistic (these have real IDs)
 * - _add (create new row) → NOT optimistic (server generates the real ID)
 *   The `refreshData()` post-PATCH in useDatabase.ts reconciles these.
 */

import type { Activity, Gol, Extra } from "@/lib/types";

// ── Toggle generico para arrays de IDs ────────────────────────────────────────
// Reutilizable para: asistentes, puntuales, biblias, socials

type ArrayField = "asistentes" | "puntuales" | "biblias" | "socials";

export const toggleArrayField =
  (field: ArrayField, id: number, value: boolean) =>
  (act: Activity): Activity => {
    const arr = [...((act[field] as number[]) || [])];
    if (value && !arr.includes(id)) arr.push(id);
    if (!value) {
      const idx = arr.indexOf(id);
      if (idx !== -1) arr.splice(idx, 1);
    }
    return { ...act, [field]: arr };
  };

// ── Equipos ──────────────────────────────────────────────────────────────────

export const setTeamField =
  (pid: number, team: string | null) =>
  (act: Activity): Activity => {
    const next = { ...act.equipos };
    if (team === null) {
      delete next[String(pid)];
    } else {
      next[String(pid)] = team;
    }
    return { ...act, equipos: next };
  };

export const setTeamsBulk =
  (nextEquipos: Record<string, string>) =>
  (act: Activity): Activity => ({
    ...act,
    equipos: { ...nextEquipos },
  });

// ── Goles (solo remove/update — add es sin optimistic) ───────────────────────

export const removeGoal =
  (id: number) =>
  (act: Activity): Activity => ({
    ...act,
    goles: act.goles.filter((g: Gol) => g.id !== id),
  });

export const updateGoal =
  (id: number, patch: Partial<Pick<Gol, "pid" | "tipo" | "cant">>) =>
  (act: Activity): Activity => ({
    ...act,
    goles: act.goles.map((g: Gol) => (g.id === id ? { ...g, ...patch } : g)),
  });

// ── Extras (solo update/delete — add es sin optimistic) ──────────────────────

export const updateExtra =
  (id: number, patch: Partial<Pick<Extra, "puntos" | "motivo">>) =>
  (act: Activity): Activity => ({
    ...act,
    extras: act.extras.map((e: Extra) =>
      e.id === id ? { ...e, ...patch } : e,
    ),
  });

export const deleteExtra =
  (id: number) =>
  (act: Activity): Activity => ({
    ...act,
    extras: act.extras.filter((e: Extra) => e.id !== id),
  });

// ── Invitaciones (solo update/delete — add es sin optimistic) ────────────────

export const deleteInvitacion =
  (id: number) =>
  (act: Activity): Activity => ({
    ...act,
    invitaciones: act.invitaciones.filter((i) => i.id !== id),
  });

export const updateInvitacion =
  (id: number, patch: { invitador: number | null; invitadoId: number | null }) =>
  (act: Activity): Activity => ({
    ...act,
    invitaciones: act.invitaciones.map((i) =>
      i.id === id ? { ...i, ...patch } : i,
    ),
  });

// ── Juegos (solo update/delete — add es sin optimistic) ──────────────────────

export const updateGameName =
  (gameId: number | string, nombre: string) =>
  (act: Activity): Activity => ({
    ...act,
    juegos: act.juegos.map((j) =>
      j.id === gameId ? { ...j, nombre } : j,
    ),
  });

export const deleteGame =
  (gameId: number | string) =>
  (act: Activity): Activity => ({
    ...act,
    juegos: act.juegos.filter((j) => j.id !== gameId),
  });
