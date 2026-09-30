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
 *   useDatabase.ts refetches after these non-optimistic PATCHes.
 */

import type { Activity, Gol, Extra } from "@/lib/types";

// ── Toggle generico para arrays de IDs ────────────────────────────────────────
// Reutilizable para: asistentes, puntuales, biblias, socials.
// Mirrors the server side effects of each PATCH type so the optimistic row (and
// the prevEquipos/prevPos bases built from it) matches what the server stores:
// - any `true` creates the participant row → the player becomes present
// - attendance `false` deletes the row and the player's goals/extras
// - socials clears the team and, when `true`, the player's individual positions

type ArrayField = "asistentes" | "puntuales" | "biblias" | "socials";

const withId = (arr: number[] | undefined, id: number, value: boolean) => {
  const list = (arr || []).filter((x) => x !== id);
  if (value) list.push(id);
  return list;
};

const withoutTeam = (equipos: Record<string, string> | undefined, id: number) => {
  const next = { ...equipos };
  delete next[String(id)];
  return next;
};

export const toggleArrayField =
  (field: ArrayField, id: number, value: boolean) =>
  (act: Activity): Activity => {
    let next: Activity = { ...act, [field]: withId(act[field] as number[], id, value) };
    if (value && !(act.asistentes || []).includes(id)) {
      next.asistentes = [...(act.asistentes || []), id];
    }
    if (field === "asistentes" && !value) {
      next = {
        ...next,
        puntuales: withId(act.puntuales, id, false),
        biblias: withId(act.biblias, id, false),
        socials: withId(act.socials, id, false),
        equipos: withoutTeam(act.equipos, id),
        goles: (act.goles || []).filter((g) => g.pid !== id),
        extras: (act.extras || []).filter((e) => e.pid !== id),
        descuentos: (act.descuentos || []).filter((e) => e.pid !== id),
      };
    }
    if (field === "socials") {
      next.equipos = withoutTeam(act.equipos, id);
      if (value) {
        next.juegos = (act.juegos || []).map((j) =>
          j.tipo === "individual"
            ? {
                ...j,
                pos: Object.fromEntries(
                  Object.entries(j.pos || {})
                    .map(([k, ids]) => [k, ids.filter((x) => x !== String(id))] as const)
                    .filter(([, ids]) => ids.length > 0),
                ),
              }
            : j,
        );
      }
    }
    return next;
  };

// ── Equipos ──────────────────────────────────────────────────────────────────

export const setTeamField =
  (pid: number, team: string | null) =>
  (act: Activity): Activity => {
    const next = { ...act.equipos };
    if (team === null) {
      delete next[String(pid)];
      return { ...act, equipos: next };
    }
    next[String(pid)] = team;
    // Assigning a team creates the participant row on the server
    const asistentes = (act.asistentes || []).includes(pid) ? act.asistentes : [...(act.asistentes || []), pid];
    return { ...act, equipos: next, asistentes };
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
