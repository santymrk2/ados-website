import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { participants } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { Participant } from "@/lib/types";
import { handleApiError, requireAuth } from "@/lib/api-utils";
import { imagesEnabled } from "@/lib/images-config";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (!auth.success) {
    return auth.error;
  }

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID faltante" }, { status: 400 });
    }

    const result = await db
      .select()
      .from(participants)
      .where(eq(participants.id, Number(id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Jugador no encontrado" }, { status: 404 });
    }

    const p = result[0] as Participant;
    
    // Resolve image URLs (only when images are enabled)
    if (imagesEnabled) {
      if (p.foto && !p.foto.startsWith('data:') && !p.foto.startsWith('http')) {
        p.foto = `/api/images/${p.foto}`;
      }
      if (p.fotoAltaCalidad && !p.fotoAltaCalidad.startsWith('data:') && !p.fotoAltaCalidad.startsWith('http')) {
        p.fotoAltaCalidad = `/api/images/${p.fotoAltaCalidad}`;
      }
    }

    return NextResponse.json({ success: true, data: p }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (e) {
    return handleApiError(e);
  }
}
