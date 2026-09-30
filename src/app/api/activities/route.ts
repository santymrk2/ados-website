import { NextRequest, NextResponse } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiConflict, apiForbidden, handleApiError, parseBody, requireAdmin, requireAuth } from "@/lib/api-utils";
import { AppError } from "@/lib/errors";
import * as schema from "@/lib/schema";
import { eventBus } from "@/lib/eventBus";
import { activityPatchSchema, activitySaveSchema, deleteByIdSchema } from "@/lib/validation";
import { listActivities } from "./_lib/list";
import { persistActivity } from "./_lib/save";
import { getPatchHandler } from "./_lib/patch";
import type { ActivityPatchPayload, ActivitySavePayload } from "./_lib/types";

export const dynamic = 'force-dynamic';

// PATCH never rejects on the activity version: it is only a change counter
// (bumped and returned). Whole-state types (config, config_bulk, teams_bulk,
// game_pos) do per-resource compare-and-set inside their handlers against the
// prev* base the client sends, so unrelated edits never conflict (requests
// without prev*, from older clients, fall back to the activity-version check). The version
// bump also takes the activity row lock, serializing PATCHes of one activity.

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.success) {
    return auth.error;
  }

  try {
    const data = await listActivities();
    return NextResponse.json({ success: true, data }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (e) {
    return handleApiError(e);
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
      return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 });
    }

    const activityId = Number(data.id || 0);
    let dbVersion = 1;

    if (!isNew) {
      if (!activityId) {
        return NextResponse.json({ success: false, error: "ID de actividad requerido" }, { status: 400 });
      }

      const currentAct = await db
        .select()
        .from(schema.activities)
        .where(eq(schema.activities.id, activityId));

      if (currentAct.length === 0) {
        return NextResponse.json({ success: false, error: "Actividad no encontrada" }, { status: 400 });
      }

      dbVersion = currentAct[0]?.version || 1;
      const clientVersion = data.version || 1;

      if (clientVersion !== dbVersion) {
        return apiConflict(dbVersion);
      }
    }

    const savedId = await db.transaction((tx) =>
      persistActivity(tx, data, isNew, activityId, dbVersion),
    );

    eventBus.emit("data-changed");

    return NextResponse.json(
      { id: savedId, success: true },
      { status: 200 },
    );
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
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

    if (auth.role !== "admin" && type !== "biblias") {
      return apiForbidden("Solo se permite editar Biblia con este rol");
    }

    const result = await db.transaction(async (tx) => {
      const [versionClaim] = await tx
        .update(schema.activities)
        .set({ version: sql`${schema.activities.version} + 1` })
        .where(eq(schema.activities.id, activityId))
        .returning({ version: schema.activities.version, locked: schema.activities.locked });

      if (!versionClaim) {
        throw new AppError("Actividad no encontrada", 404);
      }

      const requestedData = data as Record<string, unknown> | null | undefined;
      const isUnlockRequest = type === "config" && requestedData?.k === "locked" && requestedData?.v === false;
      if (versionClaim.locked && !isUnlockRequest) {
        // Throw (not return) so the transaction rolls back the version bump
        throw new AppError("La actividad está bloqueada", 403);
      }

      const handler = getPatchHandler(type);
      if (!handler) throw new AppError("Invalid update type");

      const extra = await handler({
        tx,
        activityId,
        data,
        version: versionClaim.version,
        clientVersion: Number(version || 1),
      });
      return { success: true, ...(extra ?? {}), version: versionClaim.version };
    });

    eventBus.emit("data-changed");
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return handleApiError(e);
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

    await db.transaction(async (tx) => {
      await tx
        .delete(schema.activityParticipants)
        .where(eq(schema.activityParticipants.activityId, id));

      const jj = await tx
        .select()
        .from(schema.juegos)
        .where(eq(schema.juegos.activityId, id));
      if (jj.length > 0) {
        const jjIds = jj.map((j) => j.id);
        await tx
          .delete(schema.juegoPosiciones)
          .where(inArray(schema.juegoPosiciones.juegoId, jjIds));
      }
      await tx.delete(schema.juegos).where(eq(schema.juegos.activityId, id));

      await tx.delete(schema.partidos).where(eq(schema.partidos.activityId, id));
      await tx.delete(schema.goles).where(eq(schema.goles.activityId, id));
      await tx.delete(schema.extras).where(eq(schema.extras.activityId, id));
      await tx
        .delete(schema.invitaciones)
        .where(eq(schema.invitaciones.activityId, id));

      await tx.delete(schema.activities).where(eq(schema.activities.id, id));
    });

    eventBus.emit("data-changed");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return handleApiError(e);
  }
}
