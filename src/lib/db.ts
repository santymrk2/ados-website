import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Validar que DATABASE_URL exista - no crear Pool sin configuración
const DATABASE_URL = process.env.DATABASE_URL;

// Don't throw at import time (next build imports routes without env); /api/health reports it too
if (!DATABASE_URL) {
  console.error("[DB] DATABASE_URL is not set");
}

// Persist pool across Next.js HMR reloads to avoid connection leaks
const globalForDb = globalThis as unknown as { __activadosPool?: Pool };
const pool =
  globalForDb.__activadosPool ??
  new Pool({
    connectionString: DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX) || 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
globalForDb.__activadosPool = pool;

export const db = drizzle(pool, { schema });