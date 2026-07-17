import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, requireAdmin, requireAuth } from "@/lib/api-utils";

export const dynamic = 'force-dynamic';
import { participants, activityParticipants, goles, extras, invitaciones } from "@/lib/schema";
import { eq, or } from "drizzle-orm";
import { eventBus } from "@/lib/eventBus";
import { uploadBase64Image, minioConfig } from "@/services/minio";
import { parseBody } from "@/lib/api-utils";
import { deleteByIdSchema, participantSaveSchema } from "@/lib/validation";
import { imagesEnabled } from "@/lib/images-config";

const generateUniqueFilename = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.success) {
    return auth.error;
  }

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
      if (imagesEnabled && p.foto && !p.foto.startsWith('data:') && !p.foto.startsWith('http')) {
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
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.success) {
    return auth.error;
  }

  try {
    const parsed = await parseBody(request, participantSaveSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const { data, isNew, invitadorId } = parsed.data;

    // Handle image uploads (only when images are enabled)
    if (imagesEnabled) {
      const needsImageUpload =
        data.foto?.startsWith('data:image') ||
        data.fotoAltaCalidad?.startsWith('data:image');

      if (needsImageUpload && !minioConfig.isConfigured) {
        return NextResponse.json({ success: false, error: "El almacenamiento de imágenes no está configurado" }, { status: 503 });
      }
      
      if (data.foto && data.foto.startsWith('data:image')) {
        try {
          data.foto = await uploadBase64Image(data.foto, generateUniqueFilename('thumb'));
        } catch (uploadError) {
          console.error('[MinIO] Image upload failed:', uploadError);
          return NextResponse.json({ success: false, error: "Error al subir la imagen" }, { status: 500 });
        }
      }
      if (data.fotoAltaCalidad && data.fotoAltaCalidad.startsWith('data:image')) {
        try {
          data.fotoAltaCalidad = await uploadBase64Image(data.fotoAltaCalidad, generateUniqueFilename('full'));
        } catch (uploadError) {
          console.error('[MinIO] Image upload failed:', uploadError);
          return NextResponse.json({ success: false, error: "Error al subir la imagen" }, { status: 500 });
        }
      }
    } else {
      // When images are disabled, strip any image data before saving
      if (data.foto?.startsWith('data:image')) data.foto = null;
      if (data.fotoAltaCalidad?.startsWith('data:image')) data.fotoAltaCalidad = null;
    }
    
    if (isNew) {
      const participantData = {
        nombre: data.nombre,
        apellido: data.apellido,
        fechaNacimiento: data.fechaNacimiento,
        sexo: data.sexo,
        foto: data.foto ?? null,
        fotoAltaCalidad: data.fotoAltaCalidad ?? null,
        invitadoPor: invitadorId || null,
      };
      const result = await db.insert(participants).values(participantData).returning({ id: participants.id });
      eventBus.emit('data-changed');
      return NextResponse.json({ id: result[0].id }, { status: 200 });
    } else {
      const { id, ...participantData } = data;
      if (!id) {
        return NextResponse.json({ success: false, error: "ID de participante requerido" }, { status: 422 });
      }

      await db.update(participants).set(participantData).where(eq(participants.id, id));
      eventBus.emit('data-changed');
      return NextResponse.json({ success: true }, { status: 200 });
    }
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
    return handleApiError(e);
  }
}
