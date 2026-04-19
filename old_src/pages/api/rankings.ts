import type { APIRoute } from 'astro';
import { getRankingsCache, triggerRankingsRebuild } from '../../lib/cache';

export const GET: APIRoute = async () => {
  let rankings = getRankingsCache();
  
  if (!rankings) {
    // Si no está, lo mandamos a construir de emergencia pero devolvemos vacío o error
    triggerRankingsRebuild();
    return new Response(JSON.stringify({ error: "Calculando clasificaciones temporales, intente en unos segundos...", data: [] }), {
      status: 202,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  return new Response(JSON.stringify(rankings), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
