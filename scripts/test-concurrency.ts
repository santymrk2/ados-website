/**
 * Concurrency check for PATCH /api/activities against a REAL Postgres.
 * Run via `bun run test:concurrency` (spins a throwaway container). It writes data:
 * never point TEST_DATABASE_URL at a real database.
 */
// Env must be set before the app modules load, so they are imported dynamically below
if (!process.env.TEST_DATABASE_URL) {
  console.error("TEST_DATABASE_URL is required (throwaway database only)");
  process.exit(1);
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.AUTH_SECRET = "x".repeat(40); process.env.ADMIN_PASSWORD = "a"; process.env.VIEWER_PASSWORD = "v";
const { NextRequest } = await import("next/server");
const { eq } = await import("drizzle-orm");
const { createAuthCookieValue } = await import("@/lib/api-utils");
const route = await import("@/app/api/activities/route");
const { db } = await import("@/lib/db");
const schema = await import("@/lib/schema");
const { getActiveTeams } = await import("@/app/api/activities/_lib/helpers");
const cookie = `activados_auth=${createAuthCookieValue("admin")}`;
const patch = (body: unknown) => route.PATCH(new NextRequest("http://x/api/activities", { method: "PATCH", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(body) }));

const [act] = await db.insert(schema.activities).values({ fecha: "2026-09-30", titulo: "t", cantEquipos: 4 }).returning();
const parts = await db.insert(schema.participants).values(Array.from({ length: 20 }, (_, i) => ({ nombre: "P" + i, apellido: "X" }))).returning();
const teams = getActiveTeams(4);
const addGame = async () => (await (await patch({ activityId: act.id, type: "game_add", version: 1, data: { nombre: "g", tipo: "grupal", pos: {} } })).json()).id as number;
const g1 = await addGame(), g2 = await addGame(), g3 = await addGame();
const [start] = await db.select().from(schema.activities).where(eq(schema.activities.id, act.id));
const stale = 1; // every client holds version 1, the DB is already past it
const posOf = async (juegoId: number) =>
  (await db.select().from(schema.juegoPosiciones).where(eq(schema.juegoPosiciones.juegoId, juegoId))).map((r) => `${r.posicion}:${r.equipo}`).sort().join(",");

// (a) 40 per-player ops + game_pos on two different games + a config change, all concurrent with stale versions
const ops: { type: string; pid: number }[] = [];
parts.forEach((p) => { ops.push({ type: "attendance", pid: p.id }); ops.push({ type: "puntuales", pid: p.id }); });
const G1 = { "1": [teams[0]], "2": [teams[1]] }, G2 = { "1": [teams[2]], "2": [teams[3]] };
const results = await Promise.all([
  ...ops.map((op) => patch({ activityId: act.id, type: op.type, version: stale, data: { participantId: op.pid, value: true } })),
  patch({ activityId: act.id, type: "game_pos", version: stale, data: { juegoId: g1, pos: G1, prevPos: {} } }),
  patch({ activityId: act.id, type: "game_pos", version: stale, data: { juegoId: g2, pos: G2, prevPos: {} } }),
  patch({ activityId: act.id, type: "config", version: stale, data: { k: "titulo", v: "nuevo", prev: "t" } }),
]);
const statuses = results.map((r) => r.status);
const count = (s: number) => statuses.filter((x) => x === s).length;
console.log(`(a) mixed ops: total=${statuses.length} 200=${count(200)} 409=${count(409)} other=${statuses.length - count(200) - count(409)}`);
const rows = await db.select().from(schema.activityParticipants).where(eq(schema.activityParticipants.activityId, act.id));
const expected = new Set(parts.map((p) => p.id));
const byPid = new Map(rows.map((r) => [r.participantId, r]));
const unionOk = rows.length === expected.size && [...expected].every((pid) => byPid.get(pid)?.esPuntual === true);
const [after] = await db.select().from(schema.activities).where(eq(schema.activities.id, act.id));
const gamesOk = (await posOf(g1)) === `1:${teams[0]},2:${teams[1]}` && (await posOf(g2)) === `1:${teams[2]},2:${teams[3]}`;
console.log(`    DB rows=${rows.length} allPuntual=${unionOk} gamesSaved=${gamesOk} titulo=${after.titulo} version: start=${start.version} end=${after.version} (expected ${start.version + statuses.length})`);
const passA = count(200) === statuses.length && unionOk && gamesOk && after.titulo === "nuevo" && after.version === start.version + statuses.length;

// (b) two concurrent game_pos on the SAME game with the same prevPos: one wins, the other gets 409
const A = { "1": [teams[0]], "2": [teams[1]] }, B = { "1": [teams[2]], "2": [teams[3]] };
const gp = await Promise.all([A, B].map((pos) => patch({ activityId: act.id, type: "game_pos", version: stale, data: { juegoId: g3, pos, prevPos: {} } })));
const gpStatus = gp.map((r) => r.status);
const winner = gpStatus[0] === 200 ? A : B;
const savedTeams = await posOf(g3);
const noOverwrite = savedTeams === `1:${winner["1"][0]},2:${winner["2"][0]}`;
const conflictBody = await gp[gpStatus[0] === 200 ? 1 : 0].json();
console.log(`(b) same game statuses=${gpStatus.join(",")} saved=${savedTeams} matchesWinnerOnly=${noOverwrite} currentVersion=${conflictBody.currentVersion}`);
const passB = [...gpStatus].sort().join(",") === "200,409" && noOverwrite && typeof conflictBody.currentVersion === "number";

// (c) prevPos that doesn't match the DB (order within a position doesn't matter) -> 409; matching -> 200
const bad = await patch({ activityId: act.id, type: "game_pos", version: stale, data: { juegoId: g3, pos: {}, prevPos: { "1": [teams[1]] } } });
const good = await patch({ activityId: act.id, type: "game_pos", version: stale, data: { juegoId: g3, pos: A, prevPos: winner } });
console.log(`(c) mismatched prevPos=${bad.status} matching prevPos=${good.status} saved=${await posOf(g3)}`);
const passC = bad.status === 409 && good.status === 200;

// (d) teams_bulk / config_bulk compare-and-set
const pid = parts[0].id;
const tb1 = await patch({ activityId: act.id, type: "teams_bulk", version: stale, data: { equipos: { [pid]: teams[0] }, prevEquipos: {} } });
const tb2 = await patch({ activityId: act.id, type: "teams_bulk", version: stale, data: { equipos: { [pid]: teams[1] }, prevEquipos: {} } });
const cb = await patch({ activityId: act.id, type: "config_bulk", version: stale, data: { titulo: "x", prev: { titulo: "t" } } });
console.log(`(d) teams_bulk ok=${tb1.status} stale=${tb2.status} config_bulk stale=${cb.status}`);
const passD = tb1.status === 200 && tb2.status === 409 && cb.status === 409;

// (e) legacy clients without prev* fall back to the activity-version check
const legacyStale = await Promise.all([
  patch({ activityId: act.id, type: "game_pos", version: stale, data: { juegoId: g3, pos: B } }),
  patch({ activityId: act.id, type: "teams_bulk", version: stale, data: { equipos: {} } }),
  patch({ activityId: act.id, type: "config", version: stale, data: { k: "titulo", v: "y" } }),
  patch({ activityId: act.id, type: "config_bulk", version: stale, data: { titulo: "y" } }),
]);
const [curAct] = await db.select().from(schema.activities).where(eq(schema.activities.id, act.id));
const legacyFresh = await patch({ activityId: act.id, type: "game_pos", version: curAct.version, data: { juegoId: g3, pos: B } });
console.log(`(e) legacy stale=${legacyStale.map((r) => r.status).join(",")} legacy current version=${legacyFresh.status}`);
const passE = legacyStale.every((r) => r.status === 409) && legacyFresh.status === 200;

const pass = passA && passB && passC && passD && passE;
console.log(pass ? "PASS" : "FAIL");
process.exit(pass ? 0 : 1);

export {};
