/**
 * Edge swipe-back rules (pure functions, no DOM). Run via `bun run test:edge-swipe`.
 */
import { EDGE_WIDTH, getBackAction, isEdgeStart, shouldCommitBack } from "@/lib/edge-swipe";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Root screens have no back gesture
for (const p of ["/", "/activities", "/activities/", "/participants", "/participants/", "/calendar"]) {
  check(`sin gesto en ${p}`, getBackAction(p) === null, JSON.stringify(getBackAction(p)));
}
// Activity screens mirror the shell's back button: always to the activity list
for (const p of ["/activities/12", "/activities/12/asistencia", "/activities/12/general/"]) {
  check(`actividad ${p}`, same(getBackAction(p), { type: "push", href: "/activities" }), JSON.stringify(getBackAction(p)));
}
// Participant screens mirror AppHeader's back button: history back
for (const p of ["/participants/7", "/participants/7/edit", "/participants/new"]) {
  check(`participante ${p}`, same(getBackAction(p), { type: "back" }), JSON.stringify(getBackAction(p)));
}

check("empieza en el borde", isEdgeStart(0) && isEdgeStart(EDGE_WIDTH));
check("no empieza lejos del borde", !isEdgeStart(EDGE_WIDTH + 1));

const W = 390;
check("arrastre largo confirma", shouldCommitBack(W * 0.4, 10, 600, W));
check("arrastre corto y lento cancela", !shouldCommitBack(W * 0.2, 5, 800, W));
check("flick rapido confirma", shouldCommitBack(60, 5, 80, W));
check("flick muy corto no confirma", !shouldCommitBack(30, 0, 20, W));
check("hacia la izquierda nunca confirma", !shouldCommitBack(-200, 0, 100, W));
check("mayormente vertical no confirma", !shouldCommitBack(150, 200, 300, W));
check("tiempo cero no divide por cero", !shouldCommitBack(20, 0, 0, W));

console.log(failures === 0 ? "PASS" : `FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
