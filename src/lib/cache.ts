import { eventBus } from './eventBus';
import { calcPts } from './calc';

// Objeto global en el proceso Node.js para mantener la caché entre llamadas
const globalForCache = globalThis as unknown as {
  __activadosRankingsCache: any | undefined;
  __activadosLastUpdated: number | undefined;
};

// Evita regenerar frenéticamente. Se debouncea la generación 3 segundos.
let rebuildTimeout: any = null;

export const setRankingsCache = (rankings: any) => {
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
      const activitiesParsed = activitiesRaw.map((a: any) => {
        const actId = a.id;

        // Filter related data for this activity
        const actParticipants = activityParticipantsRaw.filter((ap: any) => ap.activityId === actId);
        const actJuegos = juegosRaw.filter((j: any) => j.activityId === actId);
        const actGoles = golesRaw.filter((g: any) => g.activityId === actId);
        const actExtras = extrasRaw.filter((e: any) => e.activityId === actId);
        const actInvitaciones = invitacionesRaw.filter((i: any) => i.activityId === actId);
        const actPartidos = partidosRaw.filter((p: any) => p.activityId === actId);

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
        const juegos = actJuegos.map((j: any) => {
          const posiciones = juegoPosicionesRaw.filter((jp: any) => jp.juegoId === j.id);
          const pos: Record<string, string[]> = {};
          for (const jp of posiciones) {
            if (!pos[jp.posicion]) pos[jp.posicion] = [];
            pos[jp.posicion].push(jp.equipo);
          }
          return { id: j.id, nombre: j.nombre, pos };
        });

        // Build goles
        const goles = actGoles.map((g: any) => ({
          pid: g.participantId,
          tipo: g.tipo,
          cant: g.cant,
        }));

        // Build extras (puntos extra)
        const extras = actExtras.map((e: any) => ({
          pid: e.participantId,
          team: e.team,
          tipo: e.tipo,
          puntos: e.puntos,
          motivo: e.motivo,
        }));

        // Build invitaciones
        const invitaciones = actInvitaciones.map((i: any) => ({
          invitadorId: i.invitadorId,
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

      const rankings = participantsRaw.map(p => {
         const stats = calcPts(p.id, activitiesParsed, participantsRaw);
         return {
           id: p.id,
           total: stats.total,
           gf: stats.gf,
           gh: stats.gh,
           gb: stats.gb,
           acts: stats.acts
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

// Al iniciar el server conectamos el eventBus con el rebuild
// Y lanzamos el primero
if (typeof process !== 'undefined') {
  eventBus.on('data-changed', triggerRankingsRebuild);
  setTimeout(triggerRankingsRebuild, 5000);
}
