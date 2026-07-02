import { PTS, TEAMS } from "./constants";
import type { Activity, Participant, ParticipantBasic, ParticipantStats } from "./types";

type AnyParticipant = Participant | ParticipantBasic;

const ACTIVITY_POINTS_DETAIL_TYPE = {
  BASE: "base",
  GAME: "game",
  SOCIAL: "social",
  INVITE: "invite",
  EXTRA: "extra",
  DISCOUNT: "discount",
  GOAL: "goal",
} as const;

type ActivityPointsDetailType = (typeof ACTIVITY_POINTS_DETAIL_TYPE)[keyof typeof ACTIVITY_POINTS_DETAIL_TYPE];

export interface ActivityPointsDetail {
  label: string;
  pts: number;
  type: ActivityPointsDetailType;
  sublabel?: string;
}

const GOAL_LABELS = {
  f: "Goles faltantes",
  h: "Goles hora",
  b: "Goles Biblia",
} as const;

function getParticipantName(pid: number | null | undefined, participants: AnyParticipant[]) {
  const participant = participants.find((p) => p.id === pid);
  return participant ? `${participant.nombre} ${participant.apellido}` : null;
}

export function actPtsDetails(pid: number, a: Activity, participants: AnyParticipant[]): ActivityPointsDetail[] {
  const p = participants.find((x) => x.id === pid);
  if (!p) return [];

  const team = a.equipos?.[String(pid)];
  const here = a.asistentes.includes(pid);
  if (!here) return [];

  const details: ActivityPointsDetail[] = [
    { label: "Asistencia", pts: PTS.asistencia, type: ACTIVITY_POINTS_DETAIL_TYPE.BASE },
  ];

  if (a.puntuales.includes(pid)) {
    details.push({ label: "Puntualidad", pts: PTS.puntualidad, type: ACTIVITY_POINTS_DETAIL_TYPE.BASE });
  }
  if (a.biblias.includes(pid)) {
    details.push({ label: "Biblia", pts: PTS.biblia, type: ACTIVITY_POINTS_DETAIL_TYPE.BASE });
  }

  const isSocial = (a.socials || []).includes(pid);

  if (isSocial) {
    for (const j of a.juegos || []) {
      details.push({
        label: j.nombre || "Juego",
        pts: PTS.rec[4] || 0,
        type: ACTIVITY_POINTS_DETAIL_TYPE.SOCIAL,
        sublabel: "Social",
      });
    }
  } else {
    for (const j of a.juegos || []) {
      let position: number | undefined;
      if (j.pos && typeof j.pos === "object") {
        for (const [posStr, items] of Object.entries(j.pos)) {
          if (!Array.isArray(items)) continue;

          if (j.tipo === "individual") {
            if (items.includes(String(pid))) {
              position = Number(posStr);
              break;
            }
          } else if (team && items.includes(team)) {
            position = Number(posStr);
            break;
          }
        }
      }

      if (position !== undefined && PTS.rec[position]) {
        details.push({
          label: j.nombre || "Juego",
          pts: PTS.rec[position],
          type: ACTIVITY_POINTS_DETAIL_TYPE.GAME,
          sublabel: `${position}° puesto`,
        });
      }
    }
  }

  for (const invitation of a.invitaciones || []) {
    if (invitation.invitador !== pid) continue;
    const invitedName = getParticipantName(invitation.invitadoId, participants);
    details.push({
      label: invitedName ? `Invitó a ${invitedName}` : "Invitación",
      pts: PTS.invite,
      type: ACTIVITY_POINTS_DETAIL_TYPE.INVITE,
    });
  }

  for (const e of a.extras || []) {
    if (e.pid === pid || (team && e.team === team)) {
      details.push({
        label: e.motivo || e.desc || "Extra",
        pts: e.puntos,
        type: ACTIVITY_POINTS_DETAIL_TYPE.EXTRA,
      });
    }
  }
  for (const d of a.descuentos || []) {
    if (d.pid === pid || (team && d.team === team)) {
      details.push({
        label: d.motivo || d.desc || "Descuento",
        pts: -d.puntos,
        type: ACTIVITY_POINTS_DETAIL_TYPE.DISCOUNT,
      });
    }
  }

  return details;
}

export function actRankingPtsDetails(pid: number, a: Activity, participants: AnyParticipant[]): ActivityPointsDetail[] {
  const details = actPtsDetails(pid, a, participants);
  if (!a.asistentes.includes(pid)) return details;

  const goalCounts = (a.goles || []).reduce<Record<keyof typeof GOAL_LABELS, number>>(
    (acc, goal) => {
      if (goal.pid !== pid) return acc;
      if (goal.tipo === "f" || goal.tipo === "h" || goal.tipo === "b") {
        acc[goal.tipo] += goal.cant;
      }
      return acc;
    },
    { f: 0, h: 0, b: 0 },
  );

  for (const type of ["f", "h", "b"] as const) {
    if (goalCounts[type] > 0) {
      details.push({
        label: GOAL_LABELS[type],
        pts: goalCounts[type],
        type: ACTIVITY_POINTS_DETAIL_TYPE.GOAL,
      });
    }
  }

  return details;
}

export function actPts(pid: number, a: Activity, participants: AnyParticipant[]): number {
  return actPtsDetails(pid, a, participants).reduce((sum, detail) => sum + detail.pts, 0);
}

export function actGoles(pid: number, a: Activity): number {
  return (a.goles || [])
    .filter((g) => g.pid === pid)
    .reduce((s, g) => s + g.cant, 0);
}

export function calcPts(pid: number, activities: Activity[], participants: AnyParticipant[]): ParticipantStats {
  let total = 0,
    gf = 0,
    gh = 0,
    gb = 0,
    acts = 0;

  for (const a of activities) {
    const here = a.asistentes.includes(pid);
    if (here) acts++;
    total += actPts(pid, a, participants);
    for (const g of a.goles || []) {
      if (here && g.pid === pid) {
        if (g.tipo === "f") gf += g.cant;
        else if (g.tipo === "h") gh += g.cant;
        else gb += g.cant;
      }
    }
  }

  return { total: total + gf + gh + gb, gf, gh, gb, acts };
}

export function calcDayTeamPts(a: Activity, participants: AnyParticipant[]): Record<string, number> {
  const acc: Record<string, number> = {};
  TEAMS.forEach((t) => (acc[t] = 0));
  for (const [pidStr, team] of Object.entries(a.equipos || {})) {
    const pid = Number(pidStr);
    if (!a.asistentes.includes(pid)) continue;
    const t = team;
    if (acc[t] !== undefined) {
      acc[t] = (acc[t] || 0) + actPts(pid, a, participants);
    }
  }
  return acc;
}
