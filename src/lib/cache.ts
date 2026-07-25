import { calcPts } from './calc';
import type { Ranking, Juego, Gol, Extra, Invitacion } from './types';

// Global in-process cache — survives across requests on the same warm instance.
// On Vercel serverless cold starts it's simply undefined, so computeRankings runs fresh.
const globalForCache = globalThis as unknown as {
  __activadosRankingsCache: Ranking[] | undefined;
  __activadosLastUpdated: number | undefined;
};

// Short TTL: only prevents recalculating for near-simultaneous requests on the
// SAME warm instance. If the instance is new (cold start / different Vercel instance),
// it recalculates without issue.
const CACHE_TTL_MS = 10_000;

/**
 * Compute rankings from scratch by reading all data from the DB.
 * This is the single source of truth — no background timers, no eventBus dependency.
 */
export const computeRankings = async (): Promise<Ranking[]> => {
  const { db } = await import('./db');
  const schema = await import('./schema');

  const participantsRaw = await db.select().from(schema.participants);
  const activitiesRaw = await db.select().from(schema.activities);

  const [
    activityParticipantsRaw,
    juegosRaw,
    juegoPosicionesRaw,
    partidosRaw,
    golesRaw,
    extrasRaw,
    invitacionesRaw,
  ] = await Promise.all([
    db.select().from(schema.activityParticipants),
    db.select().from(schema.juegos),
    db.select().from(schema.juegoPosiciones),
    db.select().from(schema.partidos),
    db.select().from(schema.goles),
    db.select().from(schema.extras),
    db.select().from(schema.invitaciones),
  ]);

  const activitiesParsed = activitiesRaw.map((a) => {
    const actId = a.id;

    const actParticipants = activityParticipantsRaw.filter((ap) => ap.activityId === actId);
    const actJuegos = juegosRaw.filter((j) => j.activityId === actId);
    const actGoles = golesRaw.filter((g) => g.activityId === actId);
    const actExtras = extrasRaw.filter((e) => e.activityId === actId);
    const actInvitaciones = invitacionesRaw.filter((i) => i.activityId === actId);
    const actPartidos = partidosRaw.filter((p) => p.activityId === actId);

    const asistentes: number[] = [];
    const puntuales: number[] = [];
    const biblias: number[] = [];
    const socials: number[] = [];
    const equipos: Record<string, string> = {};
    const seenParticipants = new Set<number>();

    for (const ap of actParticipants) {
      const pid = ap.participantId;
      if (pid && !seenParticipants.has(pid)) {
        seenParticipants.add(pid);
        asistentes.push(pid);
      }
      if (ap.esPuntual) puntuales.push(pid);
      if (ap.tieneBiblia) biblias.push(pid);
      if (ap.esSocial) socials.push(pid);
      if (ap.equipo && pid) {
        equipos[pid] = ap.equipo;
      }
    }

    const juegos: Juego[] = actJuegos.map((j) => {
      const posiciones = juegoPosicionesRaw.filter((jp) => jp.juegoId === j.id);
      const pos: Record<string, string[]> = {};
      const isIndividual = posiciones.some(
        (jp) => jp.posicion === 0 && jp.equipo === "__individual__",
      );

      for (const jp of posiciones) {
        if (jp.posicion === 0 && jp.equipo === "__individual__") continue;
        if (!pos[jp.posicion]) pos[jp.posicion] = [];
        if (isIndividual) {
          if (jp.participantId) pos[jp.posicion].push(String(jp.participantId));
        } else {
          if (jp.equipo) pos[jp.posicion].push(jp.equipo);
        }
      }
      Object.values(pos).forEach((teams) => teams.sort());
      return { id: j.id, nombre: j.nombre, tipo: isIndividual ? "individual" : "grupal", pos };
    });

    const goles: Gol[] = actGoles.map((g) => ({
      pid: g.participantId,
      tipo: g.tipo as Gol['tipo'],
      cant: g.cant,
    }));

    const extras: Extra[] = actExtras
      .filter((e) => e.tipo === "extra")
      .map((e) => ({
        pid: e.participantId,
        team: e.team,
        tipo: "extra",
        puntos: e.puntos,
        motivo: e.motivo,
      }));

    const descuentos: Extra[] = actExtras
      .filter((e) => e.tipo === "descuento")
      .map((e) => ({
        pid: e.participantId,
        team: e.team,
        tipo: "descuento",
        puntos: e.puntos,
        motivo: e.motivo,
      }));

    const invitaciones: Invitacion[] = actInvitaciones.map((i) => ({
      invitador: i.invitadorId,
      invitadoId: i.invitadoId,
    }));

    return {
      id: actId,
      fecha: a.fecha,
      titulo: a.titulo || "",
      cantEquipos: a.cantEquipos || 4,
      locked: !!a.locked,
      asistentes,
      puntuales,
      biblias,
      socials,
      equipos,
      juegos,
      partidos: actPartidos,
      goles,
      extras,
      descuentos,
      invitaciones,
    };
  });

  const invitadosCount: Record<number, number> = {};
  for (const inv of invitacionesRaw) {
    if (inv.invitadorId) {
      invitadosCount[inv.invitadorId] = (invitadosCount[inv.invitadorId] || 0) + 1;
    }
  }

  const rankings: Ranking[] = participantsRaw.map((p) => {
    const stats = calcPts(p.id, activitiesParsed, participantsRaw);
    return {
      id: p.id,
      total: stats.total,
      gf: stats.gf,
      gh: stats.gh,
      gb: stats.gb,
      acts: stats.acts,
      invitados: invitadosCount[p.id] || 0,
    };
  }).sort((a, b) => b.total - a.total);

  return rankings;
};

/**
 * Get rankings, recomputing only if the cache is cold or stale (>10s).
 * On Vercel cold starts this always computes fresh. On warm instances it
 * serves from cache for ~10s to avoid hammering the DB on burst traffic.
 */
export const getRankings = async (): Promise<Ranking[]> => {
  const cached = globalForCache.__activadosRankingsCache;
  const lastUpdated = globalForCache.__activadosLastUpdated || 0;

  if (cached && Date.now() - lastUpdated < CACHE_TTL_MS) {
    return cached;
  }

  const rankings = await computeRankings();
  globalForCache.__activadosRankingsCache = rankings;
  globalForCache.__activadosLastUpdated = Date.now();
  return rankings;
};

/**
 * Bust the cache so the next getRankings() call recomputes from scratch.
 * Optional: call after POST/PATCH on activities for immediate freshness.
 */
export const invalidateRankingsCache = () => {
  globalForCache.__activadosLastUpdated = 0;
};
