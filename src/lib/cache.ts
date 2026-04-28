import { eventBus } from './eventBus';
import { calcPts } from './calc';
import type { Activity, Participant, Ranking, Juego, Gol, Extra, Invitacion } from './types';

// Objeto global en el proceso Node.js para mantener la caché entre llamadas
const globalForCache = globalThis as unknown as {
  __activadosRankingsCache: Ranking[] | undefined;
  __activadosLastUpdated: number | undefined;
};

// Evita regenerar frenéticamente. Se debouncea la generación 3 segundos.
let rebuildTimeout: ReturnType<typeof setTimeout> | null = null;

export const setRankingsCache = (rankings: Ranking[]) => {
  globalForCache.__activadosRankingsCache = rankings;
  globalForCache.__activadosLastUpdated = Date.now();
};

export const getRankingsCache = () => {
  return globalForCache.__activadosRankingsCache || null;
};

export const triggerRankingsRebuild = () => {
  if (rebuildTimeout) clearTimeout(rebuildTimeout);

  rebuildTimeout = setTimeout(async () => {
    try {
      console.log('🔄 Rebuilding rankings cache...');
      // To strictly avoid circular imports or heavy Drizzle instance loads at boot,
      // we fetch via internal API call if needed, or by importing DB module.
      const { db } = await import('./db');
      const schema = await import('./schema');

      const participantsRaw = await db.select().from(schema.participants);

      // Get activities from DB directly instead of calling API
      const activitiesRaw = await db.select().from(schema.activities);

      // Get all related data
      const [activityParticipantsRaw, juegosRaw, juegoPosicionesRaw, partidosRaw, golesRaw, extrasRaw, invitacionesRaw] = await Promise.all([
        db.select().from(schema.activityParticipants),
        db.select().from(schema.juegos),
        db.select().from(schema.juegoPosiciones),
        db.select().from(schema.partidos),
        db.select().from(schema.goles),
        db.select().from(schema.extras),
        db.select().from(schema.invitaciones),
      ]);

      // Build activities with all related data
      const activitiesParsed = activitiesRaw.map((a) => {
        const actId = a.id;

        // Filter related data for this activity
        const actParticipants = activityParticipantsRaw.filter((ap) => ap.activityId === actId);
        const actJuegos = juegosRaw.filter((j) => j.activityId === actId);
        const actGoles = golesRaw.filter((g) => g.activityId === actId);
        const actExtras = extrasRaw.filter((e) => e.activityId === actId);
        const actInvitaciones = invitacionesRaw.filter((i) => i.activityId === actId);
        const actPartidos = partidosRaw.filter((p) => p.activityId === actId);

        // Build asistentes, puntuales, biblias, socials, equipos
        const asistentes: number[] = [];
        const puntuales: number[] = [];
        const biblias: number[] = [];
        const socials: number[] = [];
        const equipos: Record<string, string> = {};

        for (const ap of actParticipants) {
          if (ap.participantId) asistentes.push(ap.participantId);
          if (ap.esPuntual) puntuales.push(ap.participantId);
          if (ap.tieneBiblia) biblias.push(ap.participantId);
          if (ap.esSocial) socials.push(ap.participantId);
          if (ap.equipo && ap.participantId) {
            equipos[ap.participantId] = ap.equipo;
          }
        }

        // Build juegos with posiciones
        const juegos: Juego[] = actJuegos.map((j) => {
          const posiciones = juegoPosicionesRaw.filter((jp) => jp.juegoId === j.id);
          const pos: Record<string, string[]> = {};
          for (const jp of posiciones) {
            if (!pos[jp.posicion]) pos[jp.posicion] = [];
            pos[jp.posicion].push(jp.equipo);
          }
          return { id: j.id, nombre: j.nombre, pos };
        });

        // Build goles
        const goles: Gol[] = actGoles.map((g) => ({
          pid: g.participantId,
          tipo: g.tipo as Gol['tipo'],
          cant: g.cant,
        }));

        // Build extras (puntos extra)
        const extras: Extra[] = actExtras.map((e) => ({
          pid: e.participantId,
          team: e.team,
          tipo: e.tipo as Extra['tipo'],
          puntos: e.puntos,
          motivo: e.motivo,
        }));

        // Build invitaciones
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
          descuentos: [],
          invitaciones,
        };
      });

      // Contar invitados por cada participante
      const invitadosCount: Record<number, number> = {};
      for (const inv of invitacionesRaw) {
        if (inv.invitadorId) {
          invitadosCount[inv.invitadorId] = (invitadosCount[inv.invitadorId] || 0) + 1;
        }
      }

      const rankings: Ranking[] = participantsRaw.map(p => {
         const stats = calcPts(p.id, activitiesParsed, participantsRaw);
         return {
           id: p.id,
           total: stats.total,
           gf: stats.gf,
           gh: stats.gh,
           gb: stats.gb,
           acts: stats.acts,
           invitados: invitadosCount[p.id] || 0
         };
      }).sort((a,b) => b.total - a.total);

      setRankingsCache(rankings);
      console.log('✅ Rankings cache rebuilt successfully');
      // Podríamos emitir 'rankings-changed' en el eventBus
      eventBus.emit('rankings-changed');
    } catch (e) {
      console.error('Error rebuilding rankings cache:', e);
    }
}, 3000);
};

// Solo auto-inicializar fuera de Vercel (donde no hay event loop confiable)
if (!process.env.VERCEL) {
  eventBus.on('data-changed', triggerRankingsRebuild);
  setTimeout(triggerRankingsRebuild, 5000);
}
