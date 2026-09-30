import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { getActivityTeamSettingsMap } from "@/lib/team-settings-server";
import { INDIVIDUAL_GAME_MARKER, getActiveTeams, isActiveTeam } from "./helpers";

export async function listActivities() {
  const allActs = await db.select().from(schema.activities);
  if (allActs.length === 0) return [];

  const actIds = allActs.map((a) => a.id);

  // Execute all queries in PARALLEL using Promise.all for better performance
  const [ap, jj, part, gol, ext, inv, teamSettings] = await Promise.all([
    db.select().from(schema.activityParticipants).where(inArray(schema.activityParticipants.activityId, actIds)),
    db.select().from(schema.juegos).where(inArray(schema.juegos.activityId, actIds)),
    db.select().from(schema.partidos).where(inArray(schema.partidos.activityId, actIds)),
    db.select().from(schema.goles).where(inArray(schema.goles.activityId, actIds)),
    db.select().from(schema.extras).where(inArray(schema.extras.activityId, actIds)),
    db.select().from(schema.invitaciones).where(inArray(schema.invitaciones.activityId, actIds)),
    // Tolerates the table not existing yet (migration pending) → no overrides
    getActivityTeamSettingsMap(actIds),
  ]);

  // Then get juego posiciones after we have jjIds
  const jjIds = jj.map((j) => j.id);
  const jp = jjIds.length > 0
    ? await db.select().from(schema.juegoPosiciones).where(inArray(schema.juegoPosiciones.juegoId, jjIds))
    : [];

  const parsed = allActs.map((a) => {
    const actAp = ap.filter((x) => x.activityId === a.id);
    const activeTeams = getActiveTeams(a.cantEquipos);
    const equipos: Record<number, string> = {};

    // Deduplicate asistentes to handle duplicate DB entries
    const seenParticipants = new Set<number>();
    const uniqueAsistentes: number[] = [];
    actAp.forEach((x) => {
      if (x.participantId && !seenParticipants.has(x.participantId)) {
        seenParticipants.add(x.participantId);
        uniqueAsistentes.push(x.participantId);
      }
      if (x.equipo && isActiveTeam(x.equipo, a.cantEquipos)) {
        equipos[x.participantId] = x.equipo;
      }
    });

    const actJuegos = jj
      .filter((x) => x.activityId === a.id)
      .map((j) => {
        const allJp = jp.filter((x) => x.juegoId === j.id);
        const isIndividual = j.tipo === "individual" || allJp.some(
          (x) => x.equipo === INDIVIDUAL_GAME_MARKER && x.posicion === 0,
        );
        const pos: Record<string, string[]> = {};
        allJp.forEach((x) => {
          if (x.equipo === INDIVIDUAL_GAME_MARKER && x.posicion === 0) return;
          if (isIndividual) {
            if (!x.participantId || x.posicion < 1) return;
            if (!pos[x.posicion]) pos[x.posicion] = [];
            pos[x.posicion].push(String(x.participantId));
          } else {
            if (!x.equipo || !activeTeams.includes(x.equipo)) return;
            if (x.posicion < 1 || x.posicion > activeTeams.length) return;
            if (!pos[x.posicion]) pos[x.posicion] = [];
            pos[x.posicion].push(x.equipo);
          }
        });
        Object.keys(pos).forEach((k) => pos[k].sort());
        return { id: j.id, nombre: j.nombre, tipo: (isIndividual ? "individual" : "grupal") as "grupal" | "individual", pos };
      });

    return {
      id: a.id,
      version: a.version,
      fecha: a.fecha,
      titulo: a.titulo || "",
      cantEquipos: a.cantEquipos || 4,
      locked: !!a.locked,
      asistentes: uniqueAsistentes,
      puntuales: [...new Set(actAp.filter((x) => x.esPuntual).map((x) => x.participantId))],
      biblias: [...new Set(actAp.filter((x) => x.tieneBiblia).map((x) => x.participantId))],
      socials: [...new Set(actAp.filter((x) => x.esSocial).map((x) => x.participantId))],
      equipos,
      juegos: actJuegos,
      partidos: part
        .filter((x) => x.activityId === a.id)
        .map((p) => ({
          id: p.id,
          deporte: p.deporte,
          genero: p.genero,
          eq1: p.eq1,
          eq2: p.eq2,
          resultado: p.resultado,
        })),
      goles: gol
        .filter((x) => x.activityId === a.id && (!x.team || activeTeams.includes(x.team)))
        .map((x) => ({
          id: x.id,
          pid: x.participantId,
          tipo: x.tipo,
          cant: x.cant,
          matchId: x.matchId,
          team: x.team,
        })),
      extras: ext
        .filter((x) => x.activityId === a.id && x.tipo === "extra" && (!x.team || activeTeams.includes(x.team)))
        .map((x) => ({
          id: x.id,
          pid: x.participantId,
          team: x.team,
          puntos: x.puntos,
          motivo: x.motivo,
        })),
      descuentos: ext
        .filter((x) => x.activityId === a.id && x.tipo === "descuento" && (!x.team || activeTeams.includes(x.team)))
        .map((x) => ({
          id: x.id,
          pid: x.participantId,
          team: x.team,
          puntos: x.puntos,
          motivo: x.motivo,
        })),
      invitaciones: inv
        .filter((x) => x.activityId === a.id)
        .map((x) => ({
          id: x.id,
          invitador: x.invitadorId,
          invitadoId: x.invitadoId,
        })),
      teamSettings: teamSettings.get(a.id) ?? null,
    };
  });

  return parsed;
}
