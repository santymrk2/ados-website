import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Validar que DATABASE_URL exista - no crear Pool sin configuración
const DATABASE_URL = process.env.DATABASE_URL;

// Persist pool across Next.js HMR reloads to avoid connection leaks
const globalForDb = globalThis as unknown as { __activadosPool?: Pool };
const pool =
  globalForDb.__activadosPool ??
  new Pool({
    connectionString: DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
globalForDb.__activadosPool = pool;

export const db = drizzle(pool, { schema });