/**
 * Client-side optimistic store check (no server, no DB). Run via `bun run test:optimistic`.
 * Drives optimisticUpdateActivity + refreshData with fake server calls and a fake fetch.
 */
import { $activities, inflightKey, refreshData } from "@/store/appStore";
import { optimisticUpdateActivity } from "@/lib/optimisticUpdate";
import { VersionConflictError } from "@/lib/errors";
import { setTeamField, toggleArrayField } from "@/lib/activity-mutates";
import type { Activity } from "@/lib/types";

type Row = { id: number; version: number; titulo: string; asistentes: number[]; juegos: { id: number; pos: Record<string, string[]> }[] };
const asAct = (r: Row) => r as unknown as Activity;
const row = () => $activities.get()[0] as unknown as Row;

function deferred<T>() {
  let resolve!: (v: T) => void, reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

// Fake GET endpoints: each /activities GET waits for the next queued response
const activityResponses: ReturnType<typeof deferred<Row[]>>[] = [];
globalThis.fetch = (async (url: string) => {
  const json = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
  if (String(url).startsWith("/api/activities")) {
    const d = deferred<Row[]>();
    activityResponses.push(d);
    return json(await d.promise);
  }
  return json([]);
}) as typeof fetch;

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
};

const server: Row = { id: 1, version: 5, titulo: "t", asistentes: [], juegos: [{ id: 7, pos: {} }] };
$activities.set([asAct(structuredClone(server))]);

// 1. Same-key updates are queued in order, both persisted, each built on the previous one
{
  const key = inflightKey(1, "game_pos", 7);
  const setPos = (pos: Record<string, string[]>) => (a: Activity) =>
    ({ ...a, juegos: a.juegos.map((j) => (j.id === 7 ? { ...j, pos } : j)) }) as Activity;
  const sent: { pos: string; prev: string }[] = [];
  const first = deferred<{ version: number }>();
  const call = (pos: Record<string, string[]>, reply: () => Promise<{ version: number }>) => (base: Activity) => {
    sent.push({ pos: JSON.stringify(pos), prev: JSON.stringify(base.juegos.find((j) => j.id === 7)?.pos) });
    return reply();
  };
  const A = { "1": ["E1"] }, B = { "1": ["E2"] };
  const p1 = optimisticUpdateActivity(1, key, setPos(A), call(A, () => first.promise), () => {});
  const p2 = optimisticUpdateActivity(1, key, setPos(B), call(B, async () => ({ version: 7 })), () => {});
  await tick();
  check("second same-key request waits for the first", sent.length === 1, `sent=${sent.length}`);
  check("latest intent shown while queued", JSON.stringify(row().juegos[0].pos) === JSON.stringify(B));
  first.resolve({ version: 6 });
  await Promise.all([p1, p2]);
  check("both requests sent in order", sent.map((s) => s.pos).join("|") === `${JSON.stringify(A)}|${JSON.stringify(B)}`);
  check("second prevPos is the first's result", sent[1]?.prev === JSON.stringify(A), sent[1]?.prev);
  check("final row shows latest intent", JSON.stringify(row().juegos[0].pos) === JSON.stringify(B));
  check("version adopted", row().version === 7, `version=${row().version}`);
  server.juegos = [{ id: 7, pos: B }];
  server.version = 7;
}

// 2. A refresh that started before a commit doesn't revert it; one started after proves it
{
  const reply = deferred<{ version: number }>();
  const mutation = optimisticUpdateActivity(1, inflightKey(1, "attendance", 3), (a) => ({ ...a, asistentes: [...a.asistentes, 3] }), () => reply.promise, () => {});
  const staleRefresh = refreshData(false);
  await tick();
  reply.resolve({ version: 8 });
  await mutation;
  activityResponses.shift()!.resolve([structuredClone(server)]); // read before the commit
  await staleRefresh;
  check("stale refresh after commit keeps the change", row().asistentes.includes(3), `asistentes=${row().asistentes}`);
  check("stale refresh doesn't lower version", row().version === 8, `version=${row().version}`);
  server.asistentes = [3];
  server.version = 8;
  const freshRefresh = refreshData(false);
  await tick();
  activityResponses.shift()!.resolve([{ ...structuredClone(server), asistentes: [] }]); // someone removed it later
  await freshRefresh;
  check("refresh started after commit is authoritative", row().asistentes.length === 0, `asistentes=${row().asistentes}`);
  server.asistentes = [];
}

// 3. A failing mutation doesn't revert a sibling that succeeded; version never decreases
{
  const failReply = deferred<{ version: number }>();
  const failing = optimisticUpdateActivity(1, inflightKey(1, "attendance", 4), (a) => ({ ...a, asistentes: [...a.asistentes, 4] }), () => failReply.promise, () => {});
  const ok = optimisticUpdateActivity(1, inflightKey(1, "attendance", 5), (a) => ({ ...a, asistentes: [...a.asistentes, 5] }), async () => ({ version: 12 }), () => {});
  await ok;
  failReply.reject(new VersionConflictError(11));
  const err = await failing.then(() => null, (e) => e);
  check("failing mutation rejects", err instanceof VersionConflictError);
  check("sibling success kept, failed one removed", JSON.stringify(row().asistentes) === "[5]", `asistentes=${row().asistentes}`);
  check("version not rolled back", row().version === 12, `version=${row().version}`);
  // the error path started a refresh: answer it from a lagging replica (older version)
  const pending = refreshData(false);
  activityResponses.shift()!.resolve([{ ...structuredClone(server), version: 9, asistentes: [5] }]);
  await tick();
  check("older version in a refresh is ignored", row().version === 12 && row().asistentes.includes(5), `version=${row().version}`);
  // queued follow-up refresh (started after the commit) carries the real state
  while (activityResponses.length === 0) await tick();
  activityResponses.shift()!.resolve([{ ...structuredClone(server), version: 12, asistentes: [5] }]);
  await pending;
  check("version never decreases across refreshes", row().version === 12, `version=${row().version}`);
  check("sibling still shown after refreshes", row().asistentes.includes(5) && !row().asistentes.includes(4));
}

// 4. prev* comes from the row the edit was computed from; a failed predecessor hands
//    down its own base, so another user's change fetched meanwhile yields a 409
{
  const key = inflightKey(1, "game_pos", 7);
  const setPos = (pos: Record<string, string[]>) => (a: Activity) =>
    ({ ...a, juegos: a.juegos.map((j) => (j.id === 7 ? { ...j, pos } : j)) }) as Activity;
  const original = JSON.stringify(row().juegos[0].pos);
  const prevs: string[] = [];
  const aReply = deferred<{ version: number }>();
  const A = { "1": ["E3"] }, B = { "1": ["E4"] }, other = { "2": ["E1"] };
  const pA = optimisticUpdateActivity(1, key, setPos(A), (base) => { prevs.push(JSON.stringify(base.juegos[0].pos)); return aReply.promise; }, () => {});
  const pB = optimisticUpdateActivity(1, key, setPos(B), async (base) => { prevs.push(JSON.stringify(base.juegos[0].pos)); return { version: 20 }; }, () => {});
  // another user's positions arrive through a refresh while A is in flight
  const refresh = refreshData(false);
  await tick();
  activityResponses.shift()!.resolve([{ ...structuredClone(server), version: 13, juegos: [{ id: 7, pos: other }] }]);
  await refresh;
  aReply.reject(new VersionConflictError(13));
  await pA.catch(() => {});
  await pB;
  check("A sent with the row it was computed from", prevs[0] === original, prevs[0]);
  check("B inherits A's base after A failed (not the refreshed value)", prevs[1] === original, prevs[1]);
  // drain the refreshes triggered by the failure
  await tick();
  while (activityResponses.length > 0) {
    activityResponses.shift()!.resolve([{ ...structuredClone(server), version: 20, juegos: [{ id: 7, pos: B }] }]);
    await tick();
  }
}

// 1/2. Client mutates mirror the server side effects used by prevEquipos / prevPos
{
  const base = {
    ...structuredClone(server),
    asistentes: [9], puntuales: [9], biblias: [9], socials: [], equipos: { "9": "E1", "8": "E2" },
    goles: [{ id: 1, pid: 9 }, { id: 2, pid: 8 }], extras: [{ id: 1, pid: 9 }], descuentos: [{ id: 2, pid: 9 }],
    juegos: [{ id: 7, tipo: "individual", pos: { "1": ["9", "8"], "2": ["9"] } }, { id: 8, tipo: "grupal", pos: { "1": ["E1"] } }],
  } as unknown as Activity;
  const absent = toggleArrayField("asistentes", 9, false)(base);
  check("attendance=false clears team, flags, goals, extras",
    !absent.equipos["9"] && absent.equipos["8"] === "E2" && !absent.puntuales.includes(9) && !absent.biblias.includes(9) &&
    absent.goles.length === 1 && absent.extras.length === 0 && absent.descuentos.length === 0);
  const social = toggleArrayField("socials", 9, true)(base);
  check("socials=true clears team and individual positions",
    !social.equipos["9"] && JSON.stringify(social.juegos[0].pos) === JSON.stringify({ "1": ["8"] }) &&
    JSON.stringify(social.juegos[1].pos) === JSON.stringify({ "1": ["E1"] }));
  check("socials=false clears team too", !toggleArrayField("socials", 9, false)(base).equipos["9"]);
  check("puntual/team on an absent player marks them present",
    toggleArrayField("puntuales", 5, true)(base).asistentes.includes(5) && setTeamField(6, "E1")(base).asistentes.includes(6));
}

// 8. Committed entries are bounded: without refreshes, enough commits force one
{
  const before = activityResponses.length;
  for (let i = 0; i < 20; i++) {
    await optimisticUpdateActivity(1, inflightKey(1, "biblias", 100 + i), toggleArrayField("biblias", 100 + i, true), async () => ({ version: 30 + i }), () => {});
  }
  await tick();
  check("too many committed entries trigger a refresh", activityResponses.length > before, `pending GETs=${activityResponses.length}`);
}

console.log(failures === 0 ? "PASS" : `FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
