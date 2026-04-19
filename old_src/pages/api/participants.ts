import { db } from '../../lib/db';
import { participants, activityParticipants, goles, extras, invitaciones } from '../../lib/schema';
import { eq, or } from 'drizzle-orm';
import { eventBus } from '../../lib/eventBus';
import { uploadBase64Image } from '../../lib/minio';

const generateUniqueFilename = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

export async function GET({ url }: { url: URL }) {
  try {
    const searchParams = url.searchParams;
    const id = searchParams.get("id");

    if (id) {
      const result = await db
        .select()
        .from(participants)
        .where(eq(participants.id, Number(id)))
        .limit(1);
      if (result.length === 0)
        return new Response(JSON.stringify({ error: "No encontrado" }), {
          status: 404,
        });
        
      const p = result[0];
      if (p.foto && !p.foto.startsWith('data:')) p.foto = `/api/images/${p.foto}`;
      if (p.fotoAltaCalidad && !p.fotoAltaCalidad.startsWith('data:')) p.fotoAltaCalidad = `/api/images/${p.fotoAltaCalidad}`;
        
      return new Response(JSON.stringify(p), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // LISTA GENERAL (sin fotos pesadas)
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
      if (p.foto && !p.foto.startsWith('data:')) p.foto = `/api/images/${p.foto}`;
      return p;
    });

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { data, isNew, invitadorId } = body;
    
    // Check for base64 uploads and move them to Minio
    if (data.foto && data.foto.startsWith('data:image')) {
       console.log('Uploading thumbnail to Minio...');
       data.foto = await uploadBase64Image(data.foto, generateUniqueFilename('thumb'));
    }
    if (data.fotoAltaCalidad && data.fotoAltaCalidad.startsWith('data:image')) {
       console.log('Uploading original photo to Minio...');
       data.fotoAltaCalidad = await uploadBase64Image(data.fotoAltaCalidad, generateUniqueFilename('full'));
    }
    
    if (isNew) {
      delete data.id;
      const participantData = {
        ...data,
        invitadoPor: invitadorId || null,
      };
      const result = await db.insert(participants).values(participantData).returning({ id: participants.id });
      eventBus.emit('data-changed');
      return new Response(JSON.stringify({ id: result[0].id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      await db.update(participants).set(data).where(eq(participants.id, data.id));
      eventBus.emit('data-changed');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { id } = body;

    // Manual cascade deletes
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
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
