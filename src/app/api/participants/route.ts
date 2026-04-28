import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';
import { participants, activityParticipants, goles, extras, invitaciones } from "@/lib/schema";
import { eq, or } from "drizzle-orm";
import { eventBus } from "@/lib/eventBus";
import { uploadBase64Image, minioConfig } from "@/services/minio";

const generateUniqueFilename = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const result = await db
        .select()
        .from(participants)
        .where(eq(participants.id, Number(id)))
        .limit(1);
      if (result.length === 0)
        return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });

      const p = result[0];
      
      // Usar el proxy de Next.js en vez de signed URLs ( más compatible con Dokploy)
      if (p.foto && !p.foto.startsWith('data:') && !p.foto.startsWith('http')) {
        p.foto = `/api/images/${p.foto}`;
      }
      if (p.fotoAltaCalidad && !p.fotoAltaCalidad.startsWith('data:') && !p.fotoAltaCalidad.startsWith('http')) {
        p.fotoAltaCalidad = `/api/images/${p.fotoAltaCalidad}`;
      }

      return NextResponse.json({ success: true, data: p }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    const result = await db
      .select({
        id: participants.id,
        nombre: participants.nombre,
        apellido: participants.apellido,
        fechaNacimiento: participants.fechaNacimiento,
        sexo: participants.sexo,
        foto: participants.foto,
        invitadoPor: participants.invitadoPor,
      })
      .from(participants);

    const formatted = result.map(p => {
      if (p.foto && !p.foto.startsWith('data:') && !p.foto.startsWith('http')) {
        p.foto = `/api/images/${p.foto}`;
      }
      return p;
    });

    return NextResponse.json({ success: true, data: formatted }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check MinIO is configured
    if (!minioConfig.isConfigured) {
      return NextResponse.json({ error: "MinIO not configured. Please set MINIO_ENDPOINT, MINIO_ROOT_USER, and MINIO_ROOT_PASSWORD" }, { status: 500 });
    }
    
    const body = await request.json();
    const { data, isNew, invitadorId } = body;
    
    // Handle image uploads
    if (data.foto && data.foto.startsWith('data:image')) {
      try {
        data.foto = await uploadBase64Image(data.foto, generateUniqueFilename('thumb'));
      } catch (uploadError) {
        console.error('[MinIO] Image upload failed:', uploadError);
        return NextResponse.json({ error: `Error uploading image: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}` }, { status: 500 });
      }
    }
    if (data.fotoAltaCalidad && data.fotoAltaCalidad.startsWith('data:image')) {
      try {
        data.fotoAltaCalidad = await uploadBase64Image(data.fotoAltaCalidad, generateUniqueFilename('full'));
      } catch (uploadError) {
        console.error('[MinIO] Image upload failed:', uploadError);
        return NextResponse.json({ error: `Error uploading image: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}` }, { status: 500 });
      }
    }
    
    if (isNew) {
      delete data.id;
      const participantData = {
        ...data,
        invitadoPor: invitadorId || null,
      };
      const result = await db.insert(participants).values(participantData).returning({ id: participants.id });
      eventBus.emit('data-changed');
      return NextResponse.json({ id: result[0].id }, { status: 200 });
    } else {
      await db.update(participants).set(data).where(eq(participants.id, data.id));
      eventBus.emit('data-changed');
      return NextResponse.json({ success: true }, { status: 200 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    await db.delete(activityParticipants).where(eq(activityParticipants.participantId, id));
    await db.delete(goles).where(eq(goles.participantId, id));
    await db.delete(extras).where(eq(extras.participantId, id));
    await db.delete(invitaciones).where(
      or(
        eq(invitaciones.invitadorId, id),
        eq(invitaciones.invitadoId, id)
      )
    );

    await db.delete(participants).where(eq(participants.id, id));
    eventBus.emit('data-changed');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}