// Este script es para migración desde Turso (SQLite) a Postgres.
// Ya no es necesario dado que el proyecto ahora usa Postgres directamente.
// Se mantiene por referencia histórico.
import "dotenv/config";

// import { createClient } from "@libsql/client";
// import { drizzle as drizzleSQLite } from "drizzle-orm/libsql";
// import { Pool } from "pg";
// import { drizzle as drizzlePG } from "drizzle-orm/node-postgres";
// import * as sqliteSchema from "../lib/schema.sqlite";
// import * as pgSchema from "../lib/schema";

// const requiredEnv = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "DATABASE_URL"];
// for (const key of requiredEnv) {
//   if (!process.env[key]) {
//     console.error(`❌ Falta variable de entorno: ${key}`);
//     process.exit(1);
//   }
// }

// const tursoClient = createClient({
//   url: process.env.TURSO_DATABASE_URL!,
//   authToken: process.env.TURSO_AUTH_TOKEN!,
// });
// const oldDb = drizzleSQLite(tursoClient, { schema: sqliteSchema });

// const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
// const newDb = drizzlePG(pool, { schema: pgSchema });

async function migrate() {
  console.log("Este script ya no es necesario - el proyecto usa Postgres directamente.");
  console.log("Si necesitas migrar datos, usa herramientas como pg_dump/pg_restore.");
  
  // await pool.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("\n❌ Error:", err);
  process.exit(1);
});