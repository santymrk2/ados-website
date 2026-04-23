import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';
import * as schema from "@/lib/schema";
import { eq, inArray, and } from "drizzle-orm";
import { eventBus } from "@/lib/eventBus";
import { validate, configUpdateSchema } from "@/lib/validation";

// Helper function to return server errors without exposing details
function serverError(e: unknown) {
  const errorId = Date.now();
  console.error(`[API Error ${errorId}]`, e);
  return NextResponse.json(
    { success: false, error: "Error interno del servidor" },
    { status: 500 }
  );
}

// Helper for client errors
function clientError(message: string) {
  return NextResponse.json(
    { success: false, error: message },
    { status: 400 }
  );
}

// Whitelist of allowed keys for config updates - prevents SQL column injection
const ALLOWED_CONFIG_KEYS = ["locked", "titulo", "cantEquipos", "fecha"] as const;
type AllowedConfigKey = typeof ALLOWED_CONFIG_KEYS[number];

export async function GET(request: NextRequest) {
  try {
    const allActs = await db.select().from(schema.activities);
    if (allActs.length === 0) {
    return NextResponse.json({ success: true, data: [] }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    }

    const actIds = allActs.map((a) => a.id);

    // Execute all queries in PARALLEL using Promise.all for better performance
    const [ap, jj, part, gol, ext, inv] = await Promise.all([
      db.select().from(schema.activityParticipants).where(inArray(schema.activityParticipants.activityId, actIds)),
      db.select().from(schema.juegos).where(inArray(schema.juegos.activityId, actIds)),
      db.select().from(schema.partidos).where(inArray(schema.partidos.activityId, actIds)),
      db.select().from(schema.goles).where(inArray(schema.goles.activityId, actIds)),
      db.select().from(schema.extras).where(inArray(schema.extras.activityId, actIds)),
      db.select().from(schema.invitaciones).where(inArray(schema.invitaciones.activityId, actIds)),
    ]);

    // Then get juego posiciones after we have jjIds
    const jjIds = jj.map((j) => j.id);
    const jp = jjIds.length > 0
      ? await db.select().from(schema.juegoPosiciones).where(inArray(schema.juegoPosiciones.juegoId, jjIds))
      : [];

    const parsed = allActs.map((a) => {
      const actAp = ap.filter((x) => x.activityId === a.id);
      const equipos: any = {};
      actAp.forEach((x) => {
        if (x.equipo) equipos[x.participantId] = x.equipo;
      });

      const actJuegos = jj
        .filter((x) => x.activityId === a.id)
        .map((j) => {
          const pos: any = {};
          jp.filter((x) => x.juegoId === j.id).forEach((x) => {
            if (!pos[x.posicion]) pos[x.posicion] = [];
            pos[x.posicion].push(x.equipo);
          });
          Object.keys(pos).forEach((k) => pos[k].sort());
          return { id: j.id, nombre: j.nombre, pos };
        });

      return {
        id: a.id,
        version: a.version,
        fecha: a.fecha,
        titulo: a.titulo || "",
        cantEquipos: a.cantEquipos || 4,
        locked: !!a.locked,
        asistentes: actAp.map((x) => x.participantId),
        puntuales: actAp.filter((x) => x.esPuntual).map((x) => x.participantId),
        biblias: actAp.filter((x) => x.tieneBiblia).map((x) => x.participantId),
        socials: actAp.filter((x) => x.esSocial).map((x) => x.participantId),
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
          .filter((x) => x.activityId === a.id)
          .map((x) => ({
            id: x.id,
            pid: x.participantId,
            tipo: x.tipo,
            cant: x.cant,
            matchId: x.matchId,
            team: x.team,
          })),
        extras: ext
          .filter((x) => x.activityId === a.id && x.tipo === "extra")
          .map((x) => ({
            id: x.id,
            pid: x.participantId,
            team: x.team,
            puntos: x.puntos,
            motivo: x.motivo,
          })),
        descuentos: ext
          .filter((x) => x.activityId === a.id && x.tipo === "descuento")
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
      };
    });

    return NextResponse.json({ success: true, data: parsed }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, isNew } = body;

    // DEBUG: Log incoming request
    console.log("[POST /activities] isNew:", isNew, "data.id:", data?.id, "keys:", Object.keys(data || {}));

    // Validar que tenemos data
    if (!data) {
      console.error("[POST /activities] Error: data es undefined");
      return clientError("Datos inválidos");
    }

    let currentActId = data.id;

    if (isNew) {
      console.log("[POST /activities] Creating new activity");
      const result = await db
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
      // Validar que tenemos ID
      if (!currentActId) {
        console.error("[POST /activities] Error: update sin ID, data:", data);
        return clientError("ID de actividad requerido");
      }
      console.log("[POST /activities] Updating activity:", currentActId, "version:", data.version);

      // Validar versión para optimistic locking
      let dbVersion = 1;
      try {
        const currentAct = await db.select()
          .from(schema.activities)
          .where(eq(schema.activities.id, currentActId));
        dbVersion = currentAct[0]?.version || 1;
      } catch (e) {
        console.error("[POST /activities] Error getting version:", e);
      }

      const clientVersion = data.version || 1;

      if (clientVersion !== dbVersion) {
        console.log("[POST /activities] Version mismatch! client:", clientVersion, "server:", dbVersion);
        return new Response(JSON.stringify({
          error: "Versión desactualizada",
          currentVersion: dbVersion,
        }), {
          status: 409,
          headers: { "Content-Type": "application/json" }
        });
      }

      await db.transaction(async (tx) => {
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
      });
    }

    await db.transaction(async (tx) => {
      if (data.asistentes && data.asistentes.length > 0) {
        const apData = data.asistentes.map((pid: number) => ({
          activityId: currentActId,
          participantId: pid,
          equipo: data.equipos && data.equipos[pid] ? data.equipos[pid] : null,
          esPuntual: (data.puntuales || []).includes(pid),
          tieneBiblia: (data.biblias || []).includes(pid),
          esSocial: (data.socials || []).includes(pid),
        }));
        await tx.insert(schema.activityParticipants).values(apData);
      }

      if (data.juegos && data.juegos.length > 0) {
        for (const j of data.juegos) {
          const jRes = await tx
            .insert(schema.juegos)
            .values({
              activityId: currentActId,
              nombre: j.nombre || "",
            })
            .returning({ id: schema.juegos.id });
          const jId = jRes[0].id;

          if (j.pos && Object.keys(j.pos).length > 0) {
            const jpData: any[] = [];
            const seenEquipos = new Set<string>();
            Object.entries(j.pos).forEach(
              ([posStr, equipos]: [string, any]) => {
                const posicion = Number(posStr);
                if (Array.isArray(equipos) && equipos.length > 0) {
                  equipos.forEach((eqName) => {
                    if (!seenEquipos.has(eqName)) {
                      seenEquipos.add(eqName);
                      jpData.push({ juegoId: jId, equipo: eqName, posicion });
                    }
                  });
                }
              },
            );
            if (jpData.length > 0) {
              await tx
                .insert(schema.juegoPosiciones)
                .values(jpData)
                .onConflictDoUpdate({
                  target: [
                    schema.juegoPosiciones.juegoId,
                    schema.juegoPosiciones.equipo,
                  ],
                  set: { posicion: jpData[0].posicion },
                });
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
        const gData = data.goles.map((g: any) => ({
          activityId: currentActId,
          participantId: g.pid || null,
          matchId: g.matchId ? matchIdMap[g.matchId] || null : null,
          team: g.team || null,
          tipo: g.tipo,
          cant: g.cant,
        }));
        await tx.insert(schema.goles).values(gData);
      }

      const activeTeams = ["A", "B", "C", "D"].slice(0, data.cantEquipos || 4);
      const extrasData: any[] = [];

      if (data.extras && data.extras.length > 0) {
        data.extras.forEach((e: any) => {
          if (e.team && !activeTeams.includes(e.team)) return;
          if (e.pid && e.team) e.team = null;

          extrasData.push({
            activityId: currentActId,
            participantId: e.pid || null,
            team: e.team || null,
            tipo: "extra",
            puntos: e.puntos,
            motivo: e.motivo || "",
          });
        });
      }

      if (data.descuentos && data.descuentos.length > 0) {
        data.descuentos.forEach((e: any) => {
          if (e.team && !activeTeams.includes(e.team)) return;
          if (e.pid && e.team) e.team = null;

          extrasData.push({
            activityId: currentActId,
            participantId: e.pid || null,
            team: e.team || null,
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
        const invData = data.invitaciones.map((i: any) => ({
          activityId: currentActId,
          invitadorId: i.invitador,
          invitadoId: i.invitadoId || i.invitado_id, // Soporte ambos temporalmente durante migración
        }));
        await tx.insert(schema.invitaciones).values(invData);
      }
    });

    eventBus.emit("data-changed");

    return NextResponse.json(
      { id: currentActId, success: true },
      { status: 200 },
    );
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { activityId, type, data } = body;

    if (!activityId) throw new Error("Activity ID is required");

    switch (type) {
      case "config": {
        // Validate using Zod schema
        const validation = validate(configUpdateSchema, { id: activityId, data });
        if (!validation.success) {
          return clientError(validation.error);
        }

        const { k, v } = data;

        // Whitelist check - prevents SQL column injection
        if (!ALLOWED_CONFIG_KEYS.includes(k as AllowedConfigKey)) {
          console.warn(`[SECURITY] Blocked attempt to set disallowed config key: ${k}`);
          return clientError("Clave de configuración no permitida");
        }

        await db
          .update(schema.activities)
          .set({ [k]: v })
          .where(eq(schema.activities.id, activityId));
        break;
      }
      case "attendance": {
        const { participantId, value } = data;
        if (value) {
          await db
            .insert(schema.activityParticipants)
            .values({ activityId, participantId })
            .onConflictDoNothing();
        } else {
          await db
            .delete(schema.activityParticipants)
            .where(
              and(
                eq(schema.activityParticipants.activityId, activityId),
                eq(schema.activityParticipants.participantId, participantId),
              ),
            );
        }
        break;
      }
      case "puntuales": {
        const { participantId, value } = data;
        await db
          .update(schema.activityParticipants)
          .set({ esPuntual: value })
          .where(
            and(
              eq(schema.activityParticipants.activityId, activityId),
              eq(schema.activityParticipants.participantId, participantId),
            ),
          );
        break;
      }
      case "biblias": {
        const { participantId, value } = data;
        await db
          .update(schema.activityParticipants)
          .set({ tieneBiblia: value })
          .where(
            and(
              eq(schema.activityParticipants.activityId, activityId),
              eq(schema.activityParticipants.participantId, participantId),
            ),
          );
        break;
      }
      case "team": {
        const { participantId, team } = data;
        await db
          .update(schema.activityParticipants)
          .set({ equipo: team })
          .where(
            and(
              eq(schema.activityParticipants.activityId, activityId),
              eq(schema.activityParticipants.participantId, participantId),
            ),
          );
        break;
      }
      case "socials": {
        const { participantId, value } = data;
        await db
          .update(schema.activityParticipants)
          .set({ esSocial: value })
          .where(
            and(
              eq(schema.activityParticipants.activityId, activityId),
              eq(schema.activityParticipants.participantId, participantId),
            ),
          );
        break;
      }
      case "goal_add": {
        const result = await db
          .insert(schema.goles)
          .values({
            activityId,
            participantId: data.pid,
            tipo: data.tipo,
            cant: data.cant || 1,
            team: data.team || null,
            matchId: data.matchId || null,
          })
          .returning({ id: schema.goles.id });
        return NextResponse.json(
          { success: true, id: result[0].id },
          { status: 200 },
        );
      }
      case "goal_remove": {
        if (data.id) {
          await db.delete(schema.goles).where(eq(schema.goles.id, data.id));
        } else {
          const existing = await db
            .select()
            .from(schema.goles)
            .where(
              and(
                eq(schema.goles.activityId, activityId),
                eq(schema.goles.participantId, data.pid),
                eq(schema.goles.tipo, data.tipo),
              ),
            )
            .limit(1);
          if (existing.length > 0) {
            await db
              .delete(schema.goles)
              .where(eq(schema.goles.id, existing[0].id));
          }
        }
        break;
      }
      case "goal_update": {
        const { id, pid, tipo, cant } = data;
        const updateData: any = {};
        if (pid !== undefined) updateData.participantId = pid;
        if (tipo !== undefined) updateData.tipo = tipo;
        if (cant !== undefined) updateData.cant = cant;

        await db
          .update(schema.goles)
          .set(updateData)
          .where(eq(schema.goles.id, id));
        break;
      }
      case "extra_toggle": {
        const { participantId, tipo, puntos, value } = data;
        if (value) {
          await db.insert(schema.extras).values({
            activityId,
            participantId,
            tipo,
            puntos,
          });
        } else {
          await db
            .delete(schema.extras)
            .where(
              and(
                eq(schema.extras.activityId, activityId),
                eq(schema.extras.participantId, participantId),
                eq(schema.extras.tipo, tipo),
              ),
            );
        }
        break;
      }
      case "extra_add": {
        const [newExtra] = await db
          .insert(schema.extras)
          .values({
            activityId,
            participantId: data.pid || null,
            team: data.team || null,
            tipo: data.tipo || "extra",
            puntos: data.puntos || 0,
            motivo: data.motivo || "",
          })
          .returning();
        return NextResponse.json(newExtra);
      }
      case "extra_update": {
        const { id, pid, team, puntos, motivo } = data;
        const updateData: any = {};
        if (pid !== undefined) updateData.participantId = pid;
        if (team !== undefined) updateData.team = team;
        if (puntos !== undefined) updateData.puntos = puntos;
        if (motivo !== undefined) updateData.motivo = motivo;

        await db
          .update(schema.extras)
          .set(updateData)
          .where(eq(schema.extras.id, id));
        break;
      }
      case "extra_delete": {
        const { id } = data;
        await db.delete(schema.extras).where(eq(schema.extras.id, id));
        break;
      }
      case "game_add": {
        const gameResult = await db
          .insert(schema.juegos)
          .values({
            activityId,
            nombre: data.nombre || "",
          })
          .returning({ id: schema.juegos.id });
        return NextResponse.json(
          { success: true, id: gameResult[0].id },
          { status: 200 },
        );
      }
      case "game_update": {
        const { id, nombre } = data;
        await db
          .update(schema.juegos)
          .set({ nombre })
          .where(eq(schema.juegos.id, id));
        break;
      }
      case "game_delete": {
        await db
          .delete(schema.juegoPosiciones)
          .where(eq(schema.juegoPosiciones.juegoId, data.id));
        await db.delete(schema.juegos).where(eq(schema.juegos.id, data.id));
        break;
      }
      case "game_pos": {
        const { juegoId, pos } = data;
        if (!juegoId || !pos)
          throw new Error("Datos inválidos: juegoId y pos son requeridos");

        const allTeams: { equipo: string; posicion: number }[] = [];
        const seenTeams = new Set<string>();
        Object.entries(pos).forEach(([posStr, equipos]: [string, any]) => {
          const posicion = Number(posStr);
          if (Array.isArray(equipos)) {
            equipos.forEach((eqName: string) => {
              if (!seenTeams.has(eqName)) {
                seenTeams.add(eqName);
                allTeams.push({ equipo: eqName, posicion });
              }
            });
          }
        });

        await db.transaction(async (tx) => {
          await tx
            .delete(schema.juegoPosiciones)
            .where(eq(schema.juegoPosiciones.juegoId, juegoId));

          for (const teamData of allTeams) {
            try {
              await tx
                .insert(schema.juegoPosiciones)
                .values({
                  juegoId,
                  equipo: teamData.equipo,
                  posicion: teamData.posicion,
                })
                .onConflictDoUpdate({
                  target: [
                    schema.juegoPosiciones.juegoId,
                    schema.juegoPosiciones.equipo,
                  ],
                  set: { posicion: teamData.posicion },
                });
            } catch (insertErr: any) {
              console.error("[game_pos] Insert Error:", insertErr.message);
            }
          }
        });
        break;
      }
      case "partido_add": {
        await db.insert(schema.partidos).values({
          activityId,
          deporte: data.deporte,
          genero: data.genero,
          eq1: data.eq1,
          eq2: data.eq2,
          resultado: data.resultado,
        });
        break;
      }
      case "partido_update": {
        await db
          .update(schema.partidos)
          .set({
            resultado: data.resultado,
            eq1: data.eq1,
            eq2: data.eq2,
            deporte: data.deporte,
            genero: data.genero,
          })
          .where(eq(schema.partidos.id, data.id));
        break;
      }
      case "partido_delete": {
        await db.delete(schema.goles).where(eq(schema.goles.matchId, data.id));
        await db.delete(schema.partidos).where(eq(schema.partidos.id, data.id));
        break;
      }
      // === INVITACIONES (operaciones atómicas) ===
      case "invitacion_add": {
        const { invitador, invitadoId } = data;
        // Validar que tenga invitadoId
        if (!invitadoId) {
          throw new Error("La invitación debe tener un invitado seleccionado");
        }
        const result = await db
          .insert(schema.invitaciones)
          .values({
            activityId,
            invitadorId: invitador || null,
            invitadoId: Number(invitadoId),
          })
          .returning({ id: schema.invitaciones.id });
        return NextResponse.json(
          { success: true, id: result[0].id },
          { status: 200 },
        );
      }
      case "invitacion_update": {
        const { id, invitador, invitadoId } = data;
        if (!id) throw new Error("ID de invitación requerido");
        if (!invitadoId) {
          throw new Error("La invitación debe tener un invitado seleccionado");
        }
        await db
          .update(schema.invitaciones)
          .set({
            invitadorId: invitador ? Number(invitador) : null,
            invitadoId: Number(invitadoId),
          })
          .where(eq(schema.invitaciones.id, id));
        break;
      }
      case "invitacion_delete": {
        const { id } = data;
        if (!id) throw new Error("ID de invitación requerido");
        await db
          .delete(schema.invitaciones)
          .where(eq(schema.invitaciones.id, id));
        break;
      }
      default:
        throw new Error("Invalid update type");
    }

    eventBus.emit("data-changed");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    await db
      .delete(schema.activityParticipants)
      .where(eq(schema.activityParticipants.activityId, id));

    const jj = await db
      .select()
      .from(schema.juegos)
      .where(eq(schema.juegos.activityId, id));
    if (jj.length > 0) {
      const jjIds = jj.map((j) => j.id);
      await db
        .delete(schema.juegoPosiciones)
        .where(inArray(schema.juegoPosiciones.juegoId, jjIds));
    }
    await db.delete(schema.juegos).where(eq(schema.juegos.activityId, id));

    await db.delete(schema.partidos).where(eq(schema.partidos.activityId, id));
    await db.delete(schema.goles).where(eq(schema.goles.activityId, id));
    await db.delete(schema.extras).where(eq(schema.extras.activityId, id));
    await db
      .delete(schema.invitaciones)
      .where(eq(schema.invitaciones.activityId, id));

    await db.delete(schema.activities).where(eq(schema.activities.id, id));

    eventBus.emit("data-changed");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return serverError(e);
  }
}
