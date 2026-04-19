import { db } from "@/lib/db";
import { participants, activities, activityParticipants, juegos, juegoPosiciones, partidos, goles, extras, invitaciones, pushSubscriptions } from "@/lib/schema";

async function listAll() {
  console.log('=== LISTANDO TODOS LOS DOCUMENTOS ===\n');

  const tables = [
    { name: 'participants', query: db.select().from(participants) },
    { name: 'activities', query: db.select().from(activities) },
    { name: 'activityParticipants', query: db.select().from(activityParticipants) },
    { name: 'juegos', query: db.select().from(juegos) },
    { name: 'juegoPosiciones', query: db.select().from(juegoPosiciones) },
    { name: 'partidos', query: db.select().from(partidos) },
    { name: 'goles', query: db.select().from(goles) },
    { name: 'extras', query: db.select().from(extras) },
    { name: 'invitaciones', query: db.select().from(invitaciones) },
    { name: 'pushSubscriptions', query: db.select().from(pushSubscriptions) },
  ];

  for (const table of tables) {
    const data = await table.query;
    console.log(`📦 ${table.name}: ${data.length} registros`);
    if (data.length > 0) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log('');
  }
}

listAll();