/**
 * Concurrency check for PATCH /api/activities against a REAL Postgres.
 * Run via `bun run test:concurrency` (spins a throwaway container). It writes data:
 * never point TEST_DATABASE_URL at a real database.
 */
const root = process.cwd();
if (!process.env.TEST_DATABASE_URL) {
  console.error("TEST_DATABASE_URL is required (throwaway database only)");
  process.exit(1);
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.AUTH_SECRET = "x".repeat(40); process.env.ADMIN_PASSWORD = "a"; process.env.VIEWER_PASSWORD = "v";
const { NextRequest } = await import(root + "/node_modules/next/server.js");
const { createAuthCookieValue } = await import(root + "/src/lib/api-utils.ts");
const route = await import(root + "/src/app/api/activities/route.ts");
const { db } = await import(root + "/src/lib/db.ts");
const schema = await import(root + "/src/lib/schema.ts");
const { getActiveTeams } = await import(root + "/src/app/api/activities/_lib/helpers.ts");
const { eq } = await import(root + "/node_modules/drizzle-orm/index.js");
const cookie = `activados_auth=${createAuthCookieValue("admin")}`;
const patch = (body: unknown) => route.PATCH(new NextRequest("http://x/api/activities", { method: "PATCH", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(body) }));

const [act] = await db.insert(schema.activities).values({ fecha: "2026-09-30", titulo: "t", cantEquipos: 4 }).returning();
const parts = await db.insert(schema.participants).values(Array.from({ length: 20 }, (_, i) => ({ nombre: "P" + i, apellido: "X" }))).returning();
const stale = act.version; // every client holds version 1
// 3 clients, 40 ops: attendance for all 20 players, puntual for 20 players
const ops: { type: string; pid: number }[] = [];
parts.forEach((p) => { ops.push({ type: "attendance", pid: p.id }); ops.push({ type: "puntuales", pid: p.id }); });
const results = await Promise.all(ops.map((op, i) => patch({ activityId: act.id, type: op.type, version: stale + (i % 3) * 0, data: { participantId: op.pid, value: true } })));
const statuses = results.map((r) => r.status);
const count = (s: number) => statuses.filter((x) => x === s).length;
console.log(`per-player ops: total=${statuses.length} 200=${count(200)} 409=${count(409)} other=${statuses.length - count(200) - count(409)}`);
const rows = await db.select().from(schema.activityParticipants).where(eq(schema.activityParticipants.activityId, act.id));
const expected = new Set(parts.map((p) => p.id));
const byPid = new Map(rows.map((r) => [r.participantId, r]));
const unionOk = rows.length === expected.size && [...expected].every((pid) => byPid.get(pid)?.esPuntual === true);
console.log(`DB rows=${rows.length} expected=${expected.size} allPuntual=${unionOk}`);
const [after] = await db.select().from(schema.activities).where(eq(schema.activities.id, act.id));
console.log(`version: start=${stale} end=${after.version} (expected ${stale + ops.length})`);

// game_pos: two concurrent writers with same stale version
const teams = getActiveTeams(4);
const addRes = await (await patch({ activityId: act.id, type: "game_add", version: 1, data: { nombre: "g", tipo: "grupal", pos: {} } })).json();
const [juego] = await db.select().from(schema.juegos).where(eq(schema.juegos.activityId, act.id));
const [cur] = await db.select().from(schema.activities).where(eq(schema.activities.id, act.id));
const A = { "1": [teams[0]], "2": [teams[1]] }, B = { "1": [teams[2]], "2": [teams[3]] };
const gp = await Promise.all([A, B].map((pos) => patch({ activityId: act.id, type: "game_pos", version: cur.version, data: { juegoId: juego.id, pos } })));
const gpStatus = gp.map((r) => r.status);
const saved = await db.select().from(schema.juegoPosiciones).where(eq(schema.juegoPosiciones.juegoId, juego.id));
const savedTeams = saved.map((r) => r.equipo).sort().join(",");
const winner = gpStatus[0] === 200 ? A : B;
const noOverwrite = savedTeams === Object.values(winner).flat().sort().join(",");
console.log(`game_pos statuses=${gpStatus.join(",")} savedTeams=${savedTeams} matchesWinnerOnly=${noOverwrite} (game_add ok=${addRes.success})`);
const pass = count(409) === 0 && count(200) === ops.length && unionOk && after.version === stale + ops.length && gpStatus.sort().join(",") === "200,409" && noOverwrite;
console.log(pass ? "PASS" : "FAIL");
process.exit(pass ? 0 : 1);
