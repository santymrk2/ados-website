import { PTS, TEAMS } from "./constants";

export function actPts(pid: number, a: any, participants: any[]) {
  const p = participants.find((x) => x.id === pid);
  if (!p) return 0;

  const team = a.equipos?.[pid] as string | undefined;
  const here = a.asistentes.includes(pid);
  let pts = 0;

  if (here) {
    pts += PTS.asistencia;
    if (a.puntuales.includes(pid)) pts += PTS.puntualidad;
    if (a.biblias.includes(pid)) pts += PTS.biblia;

    const isSocial = (a.socials || []).includes(pid);

    if (isSocial) {
      // Social mode adds 4th place points for each game
      for (const _j of a.juegos || []) {
        pts += PTS.rec[4] || 0;
      }
    } else if (team) {
      // Nueva estructura: pos = { 1: ["E1", "E2"], 2: ["E3"], 3: ["E4"] }
      // Múltiples equipos pueden estar en la misma posición (ej: ambos ganaron)
      // Todos los equipos en esa posición reciben PTS.rec[posicion]
      for (const j of a.juegos || []) {
        // Buscar en qué posición está el equipo
        let position: number | undefined;

        if (j.pos && typeof j.pos === "object") {
          // j.pos es { posicion: [equipos] }
          for (const [posStr, equipos] of Object.entries(j.pos)) {
            if (Array.isArray(equipos) && equipos.includes(team)) {
              position = Number(posStr);
              break;
            }
          }
        }

        if (position !== undefined) {
          // @ts-ignore
          pts += PTS.rec[position] || 0;
        }
      }
    }
    if ((a.invitaciones || []).some((i: any) => i.invitador === pid))
      pts += PTS.invite;
  }

  for (const e of a.extras || []) {
    if (e.pid === pid || (team && e.team === team)) pts += e.puntos as number;
  }
  for (const d of a.descuentos || []) {
    if (d.pid === pid || (team && d.team === team)) pts -= d.puntos as number;
  }

  return pts;
}

export function actGoles(pid: number, a: any) {
  return (a.goles || [])
    .filter((g: any) => g.pid === pid)
    .reduce((s: number, g: any) => s + g.cant, 0);
}

export function calcPts(pid: number, activities: any[], participants: any[]) {
  let total = 0,
    gf = 0,
    gh = 0,
    gb = 0,
    acts = 0;

  for (const a of activities) {
    if (a.asistentes.includes(pid)) acts++;
    total += actPts(pid, a, participants);
    for (const g of a.goles || []) {
      if (g.pid === pid) {
        if (g.tipo === "f") gf += g.cant;
        else if (g.tipo === "h") gh += g.cant;
        else gb += g.cant;
      }
    }
  }

  return { total: total + gf + gh + gb, gf, gh, gb, acts };
}

export function calcDayTeamPts(a: any, participants: any[]) {
  const acc: Record<string, number> = {};
  TEAMS.forEach((t) => (acc[t] = 0));
  for (const [pidStr, team] of Object.entries(a.equipos || {})) {
    const pid = Number(pidStr);
    if (!a.asistentes.includes(pid)) continue;
    const t = team as string;
    if (acc[t] !== undefined) {
      acc[t] = (acc[t] || 0) + actPts(pid, a, participants);
    }
  }
  return acc;
}
