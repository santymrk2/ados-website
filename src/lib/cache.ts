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
      const actIds = activitiesRaw.map((a: any) => a.id);
      
      const activitiesParsed = activitiesRaw.map((a: any) => {
        return {
          id: a.id,
          fecha: a.fecha,
          titulo: a.titulo || "",
          cantEquipos: a.cantEquipos || 4,
          locked: !!a.locked,
          asistentes: [],
          puntuales: [],
          biblias: [],
          socials: [],
          equipos: {},
          juegos: [],
          partidos: [],
          goles: [],
          extras: [],
          descuentos: [],
          invitaciones: [],
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
