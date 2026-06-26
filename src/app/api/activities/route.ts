import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiForbidden, parseBody, requireAdmin, requireAuth } from "@/lib/api-utils";

export const dynamic = 'force-dynamic';
import * as schema from "@/lib/schema";
import { eq, inArray, and, gt, sql, isNull } from "drizzle-orm";
import { eventBus } from "@/lib/eventBus";
import {
  activityPatchSchema,
  activitySaveSchema,
  configUpdateSchema,
  deleteByIdSchema,
  validate,
} from "@/lib/validation";
import { TEAMS } from "@/lib/constants";

// Helper function to return server errors without exposing details
function serverError(e: unknown) {
  const errorId = Date.now();
  console.error(`[API Error ${errorId}]`, e);
  return NextResponse.json(
    { success: false, error: "Error interno del servidor" },
    { status: 500 }
  );
}

class ClientError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = "ClientError";
    this.status = status;
    this.details = details;
  }
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

type ActivityParticipantRow = typeof schema.activityParticipants.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type PositionMap = Record<string, string[]>;

interface ActivityGamePayload {
  id?: number | string;
  nombre?: string | null;
  tipo?: "grupal" | "individual";
  pos?: PositionMap | null;
}

interface ActivityMatchPayload {
  id?: number | string;
  deporte?: string | null;
  genero?: string | null;
  eq1: string;
  eq2: string;
  resultado?: string | null;
}

interface ActivityGoalPayload {
  id?: number;
  pid?: number | null;
  tipo: string;
  cant: number;
  matchId?: number | string | null;
  team?: string | null;
}

interface ActivityExtraPayload {
  id?: number;
  pid?: number | null;
  team?: string | null;
  puntos: number;
  motivo?: string | null;
}

interface ActivityInvitationPayload {
  id?: number;
  invitador?: number | null;
  invitadoId?: number | null;
  invitado_id?: number | null;
}

interface ActivitySavePayload extends Record<string, unknown> {
  id?: number;
  fecha: string;
  titulo?: string | null;
  cantEquipos?: number;
  locked?: boolean;
  version?: number;
  asistentes?: number[];
  equipos?: Record<string, string>;
  puntuales?: number[];
  biblias?: number[];
  socials?: number[];
  juegos?: ActivityGamePayload[];
  partidos?: ActivityMatchPayload[];
  goles?: ActivityGoalPayload[];
  extras?: ActivityExtraPayload[];
  descuentos?: ActivityExtraPayload[];
  invitaciones?: ActivityInvitationPayload[];
}

interface ActivityPatchPayload extends Record<string, unknown> {
  k: AllowedConfigKey;
  v: boolean | string | number;
  locked?: boolean;
  titulo?: string | null;
  fecha?: string | null;
  cantEquipos?: number | string | null;
  participantId: number;
  value: boolean;
  team: string | null;
  equipos?: Record<string, string>;
  pid: number | null;
  tipo: string;
  cant: number;
  matchId: number | null;
  id: number;
  puntos: number;
  motivo: string | null;
  nombre: string;
  juegoId: number;
  pos: PositionMap;
  deporte: string;
  genero: string;
  eq1: string;
  eq2: string;
  resultado: string | null;
  invitador: number | null;
  invitadoId: number | null;
}

function getActiveTeams(cantEquipos: number | null | undefined) {
  return TEAMS.slice(0, cantEquipos || 4);
}

const INDIVIDUAL_GAME_MARKER = "__individual__";

function isActiveTeam(team: string | null | undefined, cantEquipos: number | null | undefined) {
  return !!team && getActiveTeams(cantEquipos).includes(team);
}

function getMergedParticipantRow(rows: ActivityParticipantRow[]) {
  const sorted = [...rows].sort((a, b) => a.id - b.id);
  const keeper = sorted[0];
  if (!keeper) {
    throw new Error("No hay filas de asistencia para combinar");
  }
  const hasSocial = sorted.some((row) => !!row.esSocial);

  return {
    keeper,
    updates: {
      equipo: hasSocial ? null : sorted.find((row) => !!row.equipo)?.equipo ?? null,
      esPuntual: sorted.some((row) => !!row.esPuntual),
      tieneBiblia: sorted.some((row) => !!row.tieneBiblia),
      esSocial: hasSocial,
    },
    duplicateIds: sorted.slice(1).map((row) => row.id),
  };
}

async function ensureSingleActivityParticipant(tx: Tx, activityId: number, participantId: number) {
    const rows = await tx
      .select()
      .from(schema.activityParticipants)
      .where(
        and(
          eq(schema.activityParticipants.activityId, activityId),
          eq(schema.activityParticipants.participantId, participantId),
        ),
      );

    if (rows.length === 0) {
      await tx.insert(schema.activityParticipants).values({ activityId, participantId });
      return;
    }

    if (rows.length === 1) return;

    const { keeper, updates, duplicateIds } = getMergedParticipantRow(rows);

    await tx
      .update(schema.activityParticipants)
      .set(updates)
      .where(eq(schema.activityParticipants.id, keeper.id));

    await tx
      .delete(schema.activityParticipants)
      .where(inArray(schema.activityParticipants.id, duplicateIds));
}

async function normalizeInactiveTeamData(tx: Tx, activityId: number, cantEquipos: number) {
  const activeTeams = getActiveTeams(cantEquipos);
  const inactiveTeams = TEAMS.filter((team) => !activeTeams.includes(team));
  const allJuegos = await tx
    .select()
    .from(schema.juegos)
    .where(eq(schema.juegos.activityId, activityId));
  const juegoIds = allJuegos.map((juego) => juego.id);
    if (inactiveTeams.length > 0) {
      await tx
        .update(schema.activityParticipants)
        .set({ equipo: null })
        .where(
          and(
            eq(schema.activityParticipants.activityId, activityId),
            inArray(schema.activityParticipants.equipo, inactiveTeams),
          ),
        );
    }

    if (juegoIds.length > 0 && inactiveTeams.length > 0) {
      await tx
        .delete(schema.juegoPosiciones)
        .where(
          and(
            inArray(schema.juegoPosiciones.juegoId, juegoIds),
            inArray(schema.juegoPosiciones.equipo, inactiveTeams),
          ),
        );
    }

    if (juegoIds.length > 0) {
      await tx
        .delete(schema.juegoPosiciones)
        .where(
          and(
            inArray(schema.juegoPosiciones.juegoId, juegoIds),
            gt(schema.juegoPosiciones.posicion, cantEquipos),
            isNull(schema.juegoPosiciones.participantId),
          ),
        );
    }

    if (inactiveTeams.length > 0) {
      await tx
        .delete(schema.extras)
        .where(
          and(
            eq(schema.extras.activityId, activityId),
            inArray(schema.extras.team, inactiveTeams),
          ),
        );

      await tx
        .delete(schema.goles)
        .where(
          and(
            eq(schema.goles.activityId, activityId),
            inArray(schema.goles.team, inactiveTeams),
          ),
        );
    }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.success) {
    return auth.error;
  }

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
  const auth = requireAdmin(request);
  if (!auth.success) {
    return auth.error;
  }

  try {
    const parsed = await parseBody(request, activitySaveSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const { isNew } = parsed.data;
    const data = parsed.data.data as ActivitySavePayload;

    if (!data) {
      return clientError("Datos inválidos");
    }

    let currentActId = Number(data.id || 0);
    let dbVersion = 1;

    if (!isNew) {
      if (!currentActId) {
        return clientError("ID de actividad requerido");
      }

      const currentAct = await db
        .select()
        .from(schema.activities)
        .where(eq(schema.activities.id, currentActId));

      if (currentAct.length === 0) {
        return clientError("Actividad no encontrada");
      }

      dbVersion = currentAct[0]?.version || 1;
      const clientVersion = data.version || 1;

      if (clientVersion !== dbVersion) {
        return new Response(JSON.stringify({
          error: "Versión desactualizada",
          currentVersion: dbVersion,
        }), {
          status: 409,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    await db.transaction(async (tx) => {
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
  const auth = requireAdmin(request);
  if (!auth.success) {
    return auth.error;
  }

  try {
    const parsed = await parseBody(request, activityPatchSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const { activityId, type, version } = parsed.data;
    const data = parsed.data.data as ActivityPatchPayload;
    const fail = (message: string, status = 400, details?: Record<string, unknown>): never => {
      throw new ClientError(message, status, details);
    };

    const result = await db.transaction(async (tx) => {
      const clientVersion = Number(version || 1);
      const [versionClaim] = await tx
        .update(schema.activities)
        .set({ version: sql`${schema.activities.version} + 1` })
        .where(and(eq(schema.activities.id, activityId), eq(schema.activities.version, clientVersion)))
        .returning({ version: schema.activities.version });

      let currentActivity: { version: number; locked: boolean | null } | null = null;
      [currentActivity] = await tx
        .select({ version: schema.activities.version, locked: schema.activities.locked })
        .from(schema.activities)
        .where(eq(schema.activities.id, activityId));

      if (!versionClaim) {
        fail("Versión desactualizada", 409, {
          currentVersion: currentActivity?.version || clientVersion,
        });
      }

      const requestedData = data as Record<string, unknown> | null | undefined;
      const isUnlockRequest = type === "config" && requestedData?.k === "locked" && requestedData?.v === false;
      if (currentActivity?.locked && !isUnlockRequest) {
        return apiForbidden("La actividad está bloqueada");
      }

      switch (type) {
        case "config": {
          const validation = validate(configUpdateSchema, { id: activityId, data });
          const config = validation.success ? validation.data : fail(validation.error);
          const { k, v } = config.data;
          if (!ALLOWED_CONFIG_KEYS.includes(k as AllowedConfigKey)) {
            console.warn(`[SECURITY] Blocked attempt to set disallowed config key: ${k}`);
            fail("Clave de configuración no permitida");
          }

          await tx
            .update(schema.activities)
            .set({ [k]: v })
            .where(eq(schema.activities.id, activityId));

          if (k === "cantEquipos") {
            await normalizeInactiveTeamData(tx, activityId, Number(v));
          }

          return { success: true, version: versionClaim.version };
        }
        case "config_bulk": {
          const updates: Partial<{
            locked: boolean;
            titulo: string;
            cantEquipos: number;
            fecha: string;
          }> = {};

          if ("locked" in data) updates.locked = !!data.locked;
          if ("titulo" in data) updates.titulo = String(data.titulo || "");
          if ("fecha" in data) updates.fecha = String(data.fecha || "");
          if ("cantEquipos" in data) {
            const cantEquipos = Number(data.cantEquipos);
            if (![2, 4, 6].includes(cantEquipos)) fail("Cantidad de equipos inválida");
            updates.cantEquipos = cantEquipos;
          }

          if (Object.keys(updates).length === 0) fail("No hay cambios de configuración");

          await tx
            .update(schema.activities)
            .set(updates)
            .where(eq(schema.activities.id, activityId));

          if (updates.cantEquipos) {
            await normalizeInactiveTeamData(tx, activityId, updates.cantEquipos);
          }

          return { success: true, version: versionClaim.version };
        }
        case "attendance": {
          const { participantId, value } = data;
          if (value) {
            await ensureSingleActivityParticipant(tx, activityId, participantId);
          } else {
            await tx
              .delete(schema.activityParticipants)
              .where(
                and(
                  eq(schema.activityParticipants.activityId, activityId),
                  eq(schema.activityParticipants.participantId, participantId),
                ),
              );
            await tx
              .delete(schema.goles)
              .where(
                and(
                  eq(schema.goles.activityId, activityId),
                  eq(schema.goles.participantId, participantId),
                ),
              );
            await tx
              .delete(schema.extras)
              .where(
                and(
                  eq(schema.extras.activityId, activityId),
                  eq(schema.extras.participantId, participantId),
                ),
              );
          }
          return { success: true, version: versionClaim.version };
        }
        case "puntuales": {
          const { participantId, value } = data;
          if (value) {
            await ensureSingleActivityParticipant(tx, activityId, participantId);
          }
          await tx
            .update(schema.activityParticipants)
            .set({ esPuntual: value })
            .where(
              and(
                eq(schema.activityParticipants.activityId, activityId),
                eq(schema.activityParticipants.participantId, participantId),
              ),
            );
          return { success: true, version: versionClaim.version };
        }
        case "biblias": {
          const { participantId, value } = data;
          if (value) {
            await ensureSingleActivityParticipant(tx, activityId, participantId);
          }
          await tx
            .update(schema.activityParticipants)
            .set({ tieneBiblia: value })
            .where(
              and(
                eq(schema.activityParticipants.activityId, activityId),
                eq(schema.activityParticipants.participantId, participantId),
              ),
            );
          return { success: true, version: versionClaim.version };
        }
        case "team": {
          const { participantId, team } = data;
          if (team) {
            const [activity] = await tx
              .select({ cantEquipos: schema.activities.cantEquipos })
              .from(schema.activities)
              .where(eq(schema.activities.id, activityId));

            if (!activity) fail("Actividad no encontrada");
            if (!isActiveTeam(team, activity?.cantEquipos)) fail("Equipo no habilitado para esta actividad");

            await ensureSingleActivityParticipant(tx, activityId, participantId);
          }
          await tx
            .update(schema.activityParticipants)
            .set({ equipo: team })
            .where(
              and(
                eq(schema.activityParticipants.activityId, activityId),
                eq(schema.activityParticipants.participantId, participantId),
              ),
            );
          return { success: true, version: versionClaim.version };
        }
        case "socials": {
          const { participantId, value } = data;
          if (value) {
            await ensureSingleActivityParticipant(tx, activityId, participantId);
          }
          await tx
            .update(schema.activityParticipants)
            .set({ esSocial: value, equipo: null })
            .where(
              and(
                eq(schema.activityParticipants.activityId, activityId),
                eq(schema.activityParticipants.participantId, participantId),
              ),
            );
          return { success: true, version: versionClaim.version };
        }
        case "teams_bulk": {
          const [activity] = await tx
            .select({ cantEquipos: schema.activities.cantEquipos })
            .from(schema.activities)
            .where(eq(schema.activities.id, activityId));

          if (!activity) fail("Actividad no encontrada");

          const activeTeams = getActiveTeams(activity.cantEquipos);
          const equipos = data.equipos || {};
          const entries = Object.entries(equipos).filter(
            ([, team]) => typeof team === "string" && activeTeams.includes(team),
          );

          await tx
            .update(schema.activityParticipants)
            .set({ equipo: null })
            .where(eq(schema.activityParticipants.activityId, activityId));

          for (const [participantId, team] of entries) {
            const numericParticipantId = Number(participantId);
            if (!numericParticipantId) continue;

            const rows = await tx
              .select()
              .from(schema.activityParticipants)
              .where(
                and(
                  eq(schema.activityParticipants.activityId, activityId),
                  eq(schema.activityParticipants.participantId, numericParticipantId),
                ),
              );

            if (rows.length === 0) {
              await tx.insert(schema.activityParticipants).values({
                activityId,
                participantId: numericParticipantId,
                equipo: team as string,
              });
              continue;
            }

            await tx
              .update(schema.activityParticipants)
              .set({ equipo: team as string, esSocial: false })
              .where(
                and(
                  eq(schema.activityParticipants.activityId, activityId),
                  eq(schema.activityParticipants.participantId, numericParticipantId),
                ),
              );
          }

          return { success: true, version: versionClaim.version };
        }
        case "goal_add": {
          if (data.team) {
            const [activity] = await tx
              .select({ cantEquipos: schema.activities.cantEquipos })
              .from(schema.activities)
              .where(eq(schema.activities.id, activityId));

            if (!activity || !isActiveTeam(data.team, activity.cantEquipos)) {
              fail("Equipo no habilitado para esta actividad");
            }
          }

          const [goal] = await tx
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

          return { success: true, id: goal.id, version: versionClaim.version };
        }
        case "goal_remove": {
          if (data.id) {
            await tx.delete(schema.goles).where(eq(schema.goles.id, data.id));
          } else {
            const participantId = data.pid ?? fail("ID de participante requerido");

            const existing = await tx
              .select()
              .from(schema.goles)
              .where(
                and(
                  eq(schema.goles.activityId, activityId),
                  eq(schema.goles.participantId, participantId),
                  eq(schema.goles.tipo, data.tipo),
                ),
              )
              .limit(1);
            if (existing.length > 0) {
              await tx.delete(schema.goles).where(eq(schema.goles.id, existing[0].id));
            }
          }
          return { success: true, version: versionClaim.version };
        }
        case "goal_update": {
          const { id, pid, tipo, cant } = data;
          const updateData: Partial<{
            participantId: number | null;
            tipo: string;
            cant: number;
          }> = {};
          if (pid !== undefined) updateData.participantId = pid;
          if (tipo !== undefined) updateData.tipo = tipo;
          if (cant !== undefined) updateData.cant = cant;

          await tx
            .update(schema.goles)
            .set(updateData)
            .where(eq(schema.goles.id, id));
          return { success: true, version: versionClaim.version };
        }
        case "extra_update": {
          const { id, pid, team, puntos, motivo } = data;
          if (team) {
            const [activity] = await tx
              .select({ cantEquipos: schema.activities.cantEquipos })
              .from(schema.activities)
              .where(eq(schema.activities.id, activityId));

            if (!activity || !isActiveTeam(team, activity.cantEquipos)) {
              fail("Equipo no habilitado para esta actividad");
            }
          }

          const updateData: Partial<{
            participantId: number | null;
            team: string | null;
            puntos: number;
            motivo: string | null;
          }> = {};
          if (pid !== undefined) updateData.participantId = pid;
          if (team !== undefined) updateData.team = team;
          if (puntos !== undefined) updateData.puntos = puntos;
          if (motivo !== undefined) updateData.motivo = motivo;

          await tx
            .update(schema.extras)
            .set(updateData)
            .where(eq(schema.extras.id, id));
          return { success: true, version: versionClaim.version };
        }
        case "extra_toggle": {
          const { participantId, tipo, puntos, value } = data;
          if (value) {
            await tx.insert(schema.extras).values({
              activityId,
              participantId,
              tipo,
              puntos,
            });
          } else {
            await tx
              .delete(schema.extras)
              .where(
                and(
                  eq(schema.extras.activityId, activityId),
                  eq(schema.extras.participantId, participantId),
                  eq(schema.extras.tipo, tipo),
                ),
              );
          }
          return { success: true, version: versionClaim.version };
        }
        case "extra_add": {
          if (data.team) {
            const [activity] = await tx
              .select({ cantEquipos: schema.activities.cantEquipos })
              .from(schema.activities)
              .where(eq(schema.activities.id, activityId));

            if (!activity || !isActiveTeam(data.team, activity.cantEquipos)) {
              fail("Equipo no habilitado para esta actividad");
            }
          }

          const [extra] = await tx
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

          return { success: true, ...extra, version: versionClaim.version };
        }
        case "extra_delete": {
          const { id } = data;
          await tx.delete(schema.extras).where(eq(schema.extras.id, id));
          return { success: true, version: versionClaim.version };
        }
        case "game_add": {
          const [game] = await tx
            .insert(schema.juegos)
              .values({
                activityId,
                nombre: data.nombre || "",
                tipo: data.tipo || "grupal",
              })
              .returning({ id: schema.juegos.id });

          if (data.tipo === "individual") {
            await tx.insert(schema.juegoPosiciones).values({
              juegoId: game.id,
              equipo: INDIVIDUAL_GAME_MARKER,
              posicion: 0,
            });
          }

          return { success: true, id: game.id, version: versionClaim.version };
        }
        case "game_update": {
          const { id, nombre } = data;
          await tx
            .update(schema.juegos)
            .set({ nombre })
            .where(eq(schema.juegos.id, id));
          return { success: true, version: versionClaim.version };
        }
        case "game_delete": {
          await tx
            .delete(schema.juegoPosiciones)
            .where(eq(schema.juegoPosiciones.juegoId, data.id));
          await tx.delete(schema.juegos).where(eq(schema.juegos.id, data.id));
          return { success: true, version: versionClaim.version };
        }
        case "game_pos": {
          const { juegoId, pos } = data;
          if (!juegoId || !pos) fail("Datos inválidos: juegoId y pos son requeridos");

          const [activity] = await tx
            .select({ cantEquipos: schema.activities.cantEquipos })
            .from(schema.activities)
            .where(eq(schema.activities.id, activityId));

          if (!activity) fail("Actividad no encontrada");

          const activeTeams = getActiveTeams(activity.cantEquipos);
          const existingPositions = await tx
            .select({
              equipo: schema.juegoPosiciones.equipo,
              posicion: schema.juegoPosiciones.posicion,
              participantId: schema.juegoPosiciones.participantId,
            })
            .from(schema.juegoPosiciones)
            .where(eq(schema.juegoPosiciones.juegoId, juegoId));

          const isIndividualGame = existingPositions.some(
            (row) => row.posicion === 0 && row.equipo === INDIVIDUAL_GAME_MARKER,
          );

          await tx
            .delete(schema.juegoPosiciones)
            .where(eq(schema.juegoPosiciones.juegoId, juegoId));

          if (isIndividualGame) {
            await tx.insert(schema.juegoPosiciones).values({
              juegoId,
              equipo: INDIVIDUAL_GAME_MARKER,
              posicion: 0,
            });

            const seenPIds = new Set<number>();
            for (const [posStr, pIds] of Object.entries(pos)) {
              const posicion = Number(posStr);
              if (posicion < 1) continue;

              if (Array.isArray(pIds)) {
                for (const pidStr of pIds) {
                  const participantId = Number(pidStr);
                  if (!Number.isFinite(participantId) || participantId < 1) continue;
                  if (seenPIds.has(participantId)) continue;
                  seenPIds.add(participantId);

                  await tx
                    .insert(schema.juegoPosiciones)
                    .values({
                      juegoId,
                      participantId,
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
          } else {
            const allTeams: { equipo: string; posicion: number }[] = [];
            const seenTeams = new Set<string>();
            for (const [posStr, equipos] of Object.entries(pos)) {
              const posicion = Number(posStr);
              if (posicion < 1 || posicion > activeTeams.length) {
                fail("Posición inválida para la cantidad de equipos");
              }

              if (Array.isArray(equipos)) {
                for (const eqName of equipos) {
                  if (typeof eqName !== "string") continue;
                  if (!activeTeams.includes(eqName)) {
                    fail("Equipo no habilitado para esta actividad");
                  }
                  if (!seenTeams.has(eqName)) {
                    seenTeams.add(eqName);
                    allTeams.push({ equipo: eqName, posicion });
                  }
                }
              }
            }

            for (const teamData of allTeams) {
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
            }
          }

          return { success: true, version: versionClaim.version };
        }
        case "partido_add": {
          await tx.insert(schema.partidos).values({
            activityId,
            deporte: data.deporte,
            genero: data.genero,
            eq1: data.eq1,
            eq2: data.eq2,
            resultado: data.resultado,
          });
          return { success: true, version: versionClaim.version };
        }
        case "partido_update": {
          await tx
            .update(schema.partidos)
            .set({
              resultado: data.resultado,
              eq1: data.eq1,
              eq2: data.eq2,
              deporte: data.deporte,
              genero: data.genero,
            })
            .where(eq(schema.partidos.id, data.id));
          return { success: true, version: versionClaim.version };
        }
        case "partido_delete": {
          await tx.delete(schema.goles).where(eq(schema.goles.matchId, data.id));
          await tx.delete(schema.partidos).where(eq(schema.partidos.id, data.id));
          return { success: true, version: versionClaim.version };
        }
        case "invitacion_add": {
          const { invitador, invitadoId } = data;
          if (!invitadoId) fail("La invitación debe tener un invitado seleccionado");

          const [created] = await tx
            .insert(schema.invitaciones)
            .values({
              activityId,
              invitadorId: invitador || null,
              invitadoId: Number(invitadoId),
            })
            .returning({ id: schema.invitaciones.id });

          return { success: true, id: created.id, version: versionClaim.version };
        }
        case "invitacion_update": {
          const { id, invitador, invitadoId } = data;
          if (!id) fail("ID de invitación requerido");
          if (!invitadoId) fail("La invitación debe tener un invitado seleccionado");

          await tx
            .update(schema.invitaciones)
            .set({
              invitadorId: invitador ? Number(invitador) : null,
              invitadoId: Number(invitadoId),
            })
            .where(eq(schema.invitaciones.id, id));
          return { success: true, version: versionClaim.version };
        }
        case "invitacion_delete": {
          const { id } = data;
          if (!id) fail("ID de invitación requerido");
          await tx.delete(schema.invitaciones).where(eq(schema.invitaciones.id, id));
          return { success: true, version: versionClaim.version };
        }
        default:
          fail("Invalid update type");
      }
    });

    eventBus.emit("data-changed");
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    if (e instanceof ClientError) {
      return NextResponse.json(
        { success: false, error: e.message, ...e.details },
        { status: e.status },
      );
    }
    return serverError(e);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.success) {
    return auth.error;
  }

  try {
    const parsed = await parseBody(request, deleteByIdSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const { id } = parsed.data;

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
