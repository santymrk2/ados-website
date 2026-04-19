import { createClient } from "@libsql/client";
import { drizzle as drizzleSQLite } from "drizzle-orm/libsql";
import { Pool } from "pg";
import { drizzle as drizzlePG } from "drizzle-orm/node-postgres";
import * as sqliteSchema from "../lib/schema.sqlite";
import * as pgSchema from "../lib/schema";
import "dotenv/config";

const requiredEnv = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "DATABASE_URL"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Falta variable de entorno: ${key}`);
    process.exit(1);
  }
}

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const oldDb = drizzleSQLite(tursoClient, { schema: sqliteSchema });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const newDb = drizzlePG(pool, { schema: pgSchema });

async function migrate() {
  console.log("🚀 Iniciando migración de Turso → Postgres...\n");

  const participants = await oldDb.select().from(sqliteSchema.participants);
  console.log(`👥 Migrando ${participants.length} participants...`);
  if (participants.length > 0) {
    await newDb
      .insert(pgSchema.participants)
      .values(participants)
      .onConflictDoNothing();
  }

  const activities = await oldDb.select().from(sqliteSchema.activities);
  console.log(`📅 Migrando ${activities.length} activities...`);
  if (activities.length > 0) {
    await newDb
      .insert(pgSchema.activities)
      .values(activities)
      .onConflictDoNothing();
  }

  const activityParticipants = await oldDb
    .select()
    .from(sqliteSchema.activityParticipants);
  console.log(
    `🔗 Migrando ${activityParticipants.length} activityParticipants...`,
  );
  if (activityParticipants.length > 0) {
    await newDb
      .insert(pgSchema.activityParticipants)
      .values(activityParticipants)
      .onConflictDoNothing();
  }

  const juegos = await oldDb.select().from(sqliteSchema.juegos);
  console.log(`🎮 Migrando ${juegos.length} juegos...`);
  if (juegos.length > 0) {
    await newDb.insert(pgSchema.juegos).values(juegos).onConflictDoNothing();
  }

  const juegoPosiciones = await oldDb
    .select()
    .from(sqliteSchema.juegoPosiciones);
  console.log(`🏆 Migrando ${juegoPosiciones.length} juegoPosiciones...`);
  if (juegoPosiciones.length > 0) {
    await newDb
      .insert(pgSchema.juegoPosiciones)
      .values(juegoPosiciones)
      .onConflictDoNothing();
  }

  const partidos = await oldDb.select().from(sqliteSchema.partidos);
  console.log(`⚽ Migrando ${partidos.length} partidos...`);
  if (partidos.length > 0) {
    await newDb
      .insert(pgSchema.partidos)
      .values(partidos)
      .onConflictDoNothing();
  }

  const goles = await oldDb.select().from(sqliteSchema.goles);
  console.log(`🥅 Migrando ${goles.length} goles...`);
  if (goles.length > 0) {
    await newDb.insert(pgSchema.goles).values(goles).onConflictDoNothing();
  }

  const extras = await oldDb.select().from(sqliteSchema.extras);
  console.log(`⭐ Migrando ${extras.length} extras...`);
  if (extras.length > 0) {
    await newDb.insert(pgSchema.extras).values(extras).onConflictDoNothing();
  }

  const invitaciones = await oldDb.select().from(sqliteSchema.invitaciones);
  console.log(`💌 Migrando ${invitaciones.length} invitaciones...`);
  if (invitaciones.length > 0) {
    await newDb
      .insert(pgSchema.invitaciones)
      .values(invitaciones)
      .onConflictDoNothing();
  }

  // ✅ CRÍTICO: resetear sequences para que los nuevos IDs no colisionen
  console.log("\n🔧 Reseteando sequences...");
  await pool.query(`
    SELECT setval('participants_id_seq', COALESCE((SELECT MAX(id) FROM participants), 1));
    SELECT setval('activities_id_seq', COALESCE((SELECT MAX(id) FROM activities), 1));
    SELECT setval('activity_participants_id_seq', COALESCE((SELECT MAX(id) FROM activity_participants), 1));
    SELECT setval('juegos_id_seq', COALESCE((SELECT MAX(id) FROM juegos), 1));
    SELECT setval('juego_posiciones_id_seq', COALESCE((SELECT MAX(id) FROM juego_posiciones), 1));
    SELECT setval('partidos_id_seq', COALESCE((SELECT MAX(id) FROM partidos), 1));
    SELECT setval('goles_id_seq', COALESCE((SELECT MAX(id) FROM goles), 1));
    SELECT setval('extras_id_seq', COALESCE((SELECT MAX(id) FROM extras), 1));
    SELECT setval('invitaciones_id_seq', COALESCE((SELECT MAX(id) FROM invitaciones), 1));
  `);

  console.log("\n✅ Migración completa!");
  await pool.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("\n❌ Error en la migración:", err);
  process.exit(1);
});
