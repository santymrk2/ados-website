import { eq, inArray } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { INDIVIDUAL_GAME_MARKER, getActiveTeams } from "./helpers";
import type { ActivitySavePayload, Tx } from "./types";

/**
 * Creates or fully replaces an activity (and all its children) inside the given transaction.
 * Returns the id of the persisted activity.
 */
export async function persistActivity(
  tx: Tx,
  data: ActivitySavePayload,
  isNew: boolean,
  existingId: number,
  dbVersion: number,
): Promise<number> {
  let currentActId = existingId;

  if (isNew) {
    const result = await tx
      .insert(schema.activities)
      .values({
        fecha: data.fecha,
        titulo: data.titulo || "",
        cantEquipos: data.cantEquipos || 4,
        locked: !!data.locked,
        version: 1,
      })
      .returning({ id: schema.activities.id });
    currentActId = result[0].id;
  } else {
    await tx
      .update(schema.activities)
      .set({
        fecha: data.fecha,
        titulo: data.titulo || "",
        cantEquipos: data.cantEquipos || 4,
        locked: !!data.locked,
        version: dbVersion + 1,
      })
      .where(eq(schema.activities.id, currentActId));

    await tx
      .delete(schema.activityParticipants)
      .where(eq(schema.activityParticipants.activityId, currentActId));

    const oldJuegos = await tx
      .select()
      .from(schema.juegos)
      .where(eq(schema.juegos.activityId, currentActId));
    if (oldJuegos.length > 0) {
      const obsJIds = oldJuegos.map((j) => j.id);
      await tx
        .delete(schema.juegoPosiciones)
        .where(inArray(schema.juegoPosiciones.juegoId, obsJIds));
    }
    await tx
      .delete(schema.juegos)
      .where(eq(schema.juegos.activityId, currentActId));

    await tx
      .delete(schema.partidos)
      .where(eq(schema.partidos.activityId, currentActId));
    await tx
      .delete(schema.goles)
      .where(eq(schema.goles.activityId, currentActId));
    await tx
      .delete(schema.extras)
      .where(eq(schema.extras.activityId, currentActId));
    await tx
      .delete(schema.invitaciones)
      .where(eq(schema.invitaciones.activityId, currentActId));
  }

  const activeTeams = getActiveTeams(data.cantEquipos || 4);
  const attendeeIds = Array.from(
    new Set<number>(
      (Array.isArray(data.asistentes) ? data.asistentes : [])
        .map((pid: unknown) => Number(pid))
        .filter((pid: number) => Number.isFinite(pid) && pid > 0),
    ),
  );

  if (attendeeIds.length > 0) {
    const apData = attendeeIds.map((pid: number) => {
      const assignedTeam = data.equipos?.[String(pid)];

      return {
        activityId: currentActId,
        participantId: pid,
        equipo: assignedTeam && activeTeams.includes(assignedTeam) ? assignedTeam : null,
        esPuntual: (data.puntuales || []).includes(pid),
        tieneBiblia: (data.biblias || []).includes(pid),
        esSocial: (data.socials || []).includes(pid),
      };
    });
    await tx.insert(schema.activityParticipants).values(apData);
  }

  if (data.juegos && data.juegos.length > 0) {
    for (const j of data.juegos) {
      const isIndividual = j.tipo === "individual";
      const jRes = await tx
        .insert(schema.juegos)
        .values({
          activityId: currentActId,
          nombre: j.nombre || "",
          tipo: j.tipo || "grupal",
        })
        .returning({ id: schema.juegos.id });
      const jId = jRes[0].id;

      if (isIndividual) {
        await tx.insert(schema.juegoPosiciones).values({
          juegoId: jId,
          equipo: INDIVIDUAL_GAME_MARKER,
          posicion: 0,
        });

        if (j.pos && Object.keys(j.pos).length > 0) {
          for (const [posStr, pIds] of Object.entries(j.pos)) {
            const posicion = Number(posStr);
            if (posicion < 1) continue;
            if (Array.isArray(pIds)) {
              for (const pidStr of pIds) {
                const pid = Number(pidStr);
                if (Number.isFinite(pid) && pid > 0) {
                  await tx
                    .insert(schema.juegoPosiciones)
                    .values({
                      juegoId: jId,
                      participantId: pid,
                      posicion,
                    })
                    .onConflictDoUpdate({
                      target: [
                        schema.juegoPosiciones.juegoId,
                        schema.juegoPosiciones.participantId,
                      ],
                      set: { posicion },
                    });
                }
              }
            }
          }
        }
      } else if (j.pos && Object.keys(j.pos).length > 0) {
        const jpData: { juegoId: number; equipo: string; posicion: number }[] = [];
        const seenEquipos = new Set<string>();
        Object.entries(j.pos).forEach(
          ([posStr, equipos]) => {
            const posicion = Number(posStr);
            if (posicion < 1 || posicion > activeTeams.length) return;
            if (Array.isArray(equipos) && equipos.length > 0) {
              equipos.forEach((eqName) => {
                if (activeTeams.includes(eqName) && !seenEquipos.has(eqName)) {
                  seenEquipos.add(eqName);
                  jpData.push({ juegoId: jId, equipo: eqName, posicion });
                }
              });
            }
          },
        );
        if (jpData.length > 0) {
          for (const jp of jpData) {
            await tx
              .insert(schema.juegoPosiciones)
              .values(jp)
              .onConflictDoUpdate({
                target: [
                  schema.juegoPosiciones.juegoId,
                  schema.juegoPosiciones.equipo,
                ],
                set: { posicion: jp.posicion },
              });
          }
        }
      }
    }
  }

  const matchIdMap: Record<number | string, number> = {};

  if (data.partidos && data.partidos.length > 0) {
    for (const p of data.partidos) {
      const pRes = await tx
        .insert(schema.partidos)
        .values({
          activityId: currentActId,
          deporte: p.deporte || "Fútbol",
          genero: p.genero || "M",
          eq1: p.eq1,
          eq2: p.eq2,
          resultado: p.resultado,
        })
        .returning({ id: schema.partidos.id });

      if (p.id) {
        matchIdMap[p.id] = pRes[0].id;
      }
    }
  }

  if (data.goles && data.goles.length > 0) {
    const gData = data.goles
      .filter((g) => !g.team || activeTeams.includes(g.team))
      .map((g) => ({
        activityId: currentActId,
        participantId: g.pid || null,
        matchId: g.matchId ? matchIdMap[g.matchId] || null : null,
        team: g.team || null,
        tipo: g.tipo,
        cant: g.cant,
      }));
    if (gData.length > 0) {
      await tx.insert(schema.goles).values(gData);
    }
  }

  const extrasData: { activityId: number; participantId: number | null; team: string | null; tipo: string; puntos: number; motivo: string }[] = [];

  if (data.extras && data.extras.length > 0) {
    data.extras.forEach((e) => {
      const team = e.pid ? null : e.team || null;
      if (team && !activeTeams.includes(team)) return;

      extrasData.push({
        activityId: currentActId,
        participantId: e.pid || null,
        team,
        tipo: "extra",
        puntos: e.puntos,
        motivo: e.motivo || "",
      });
    });
  }

  if (data.descuentos && data.descuentos.length > 0) {
    data.descuentos.forEach((e) => {
      const team = e.pid ? null : e.team || null;
      if (team && !activeTeams.includes(team)) return;

      extrasData.push({
        activityId: currentActId,
        participantId: e.pid || null,
        team,
        tipo: "descuento",
        puntos: e.puntos,
        motivo: e.motivo || "",
      });
    });
  }

  if (extrasData.length > 0) {
    await tx.insert(schema.extras).values(extrasData);
  }

  if (data.invitaciones && data.invitaciones.length > 0) {
    const invData = data.invitaciones.map((i) => ({
      activityId: currentActId,
      invitadorId: i.invitador,
      invitadoId: i.invitadoId || i.invitado_id, // Soporte ambos temporalmente durante migración
    }));
    await tx.insert(schema.invitaciones).values(invData);
  }

  return currentActId;
}
