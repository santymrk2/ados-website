import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { participants } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { Participant } from "@/lib/types";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
    
    // IMPORTANTE: Aquí convertimos las fotos para que usen nuestro Proxy
    // No devolvemos la URL de MinIO directamente para evitar errores de DNS/Protocolo en el navegador
    if (p.foto && !p.foto.startsWith('data:') && !p.foto.startsWith('http')) {
      p.foto = `/api/images/${p.foto}`;
    }
    if (p.fotoAltaCalidad && !p.fotoAltaCalidad.startsWith('data:') && !p.fotoAltaCalidad.startsWith('http')) {
      p.fotoAltaCalidad = `/api/images/${p.fotoAltaCalidad}`;
    }

    return NextResponse.json({ success: true, data: p }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (e) {
    console.error("[API Participant ID] Error:", e);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
