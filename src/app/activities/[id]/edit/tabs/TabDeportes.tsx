"use client";

import { useState } from "react";
import { Trash2, Settings } from "lucide-react";
import {
  TEAMS,
  TEAM_COLORS,
  getTeamBg,
  DEPORTES,
  GENEROS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label, Empty, Modal } from "@/components/Common";
import { SexBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";
import { confirmDialog } from "@/lib/confirm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

let tempIdCounter = 0;
const generateTempId = () => -1 - tempIdCounter++;

export function TabDeportes({
  act,
  A,
  Q,
  db,
}: {
  act: any;
  A: any;
  Q?: any;
  db: any;
}) {
  const [filterGenero, setFilterGenero] = useState("all");
  const [selectedPartido, setSelectedPartido] = useState(null);

  const add = () => {
    const np = {
      id: generateTempId(),
      deporte: "Fútbol",
      genero: "M",
      eq1: "E1",
      eq2: "E2",
      resultado: null,
    };
    Q("partido_add", np, "partidos", [...(act.partidos || []), np]);
  };
  const del = (id) =>
    Q(
      "partido_delete",
      { id },
      "partidos",
      (act.partidos || []).filter((p) => p.id !== id),
    );
  const upd = (id, k, v) => {
    const newList = (act.partidos || []).map((p) =>
      p.id === id ? { ...p, [k]: v } : p,
    );
    const p = newList.find((x) => x.id === id);
    Q("partido_update", p, "partidos", newList);
  };

  const filtered = (act.partidos || []).filter(
    (p) => filterGenero === "all" || p.genero === filterGenero,
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <Label style={{ margin: 0 }}>Partidos</Label>
        <Button
          onClick={add}
          variant="ghost"
          size="sm"
          className="bg-teal-50 text-teal-600"
        >
          + Partido
        </Button>
      </div>
      <div className="mb-4">
        <Select value={filterGenero} onValueChange={setFilterGenero}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="M">Varón</SelectItem>
            <SelectItem value="F">Mujer</SelectItem>
            <SelectItem value="MX">Mixto</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <Empty text="Sin partidos" />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <PartidoResumenCard
              key={p.id}
              part={p}
              act={act}
              onClick={() => setSelectedPartido(p)}
            />
          ))}
        </div>
      )}
      {selectedPartido && (
        <PartidoEditModal
          part={selectedPartido}
          act={act}
          db={db}
          onClose={() => setSelectedPartido(null)}
          onUpd={upd}
          onDel={del}
          Q={Q}
        />
      )}
    </div>
  );
}

function PartidoResumenCard({ part, act, onClick }) {
  const goles = (act.goles || []).filter((g) => g.matchId === part.id);
  const score1 = goles.filter((g) => g.team === part.eq1).length;
  const score2 = goles.filter((g) => g.team === part.eq2).length;
  const icons = { Fútbol: "⚽", Handball: "🤾", Básquet: "🏀", Vóley: "🏐" };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-surface-dark p-3 flex items-center justify-between cursor-pointer active:scale-95 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <div className="text-xl">{icons[part.deporte] || "🎲"}</div>
        <div>
          <div className="font-bold text-sm">{part.deporte}</div>
          <SexBadge sex={part.genero} className="w-3 h-3" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="font-black text-sm"
          style={{ color: score1 > score2 ? "#22C55E" : "#666" }}
        >
          {part.eq1}
        </span>
        <div className="bg-surface-dark rounded px-2 py-0.5 font-black text-sm">
          {score1} : {score2}
        </div>
        <span
          className="font-black text-sm"
          style={{ color: score2 > score1 ? "#22C55E" : "#666" }}
        >
          {part.eq2}
        </span>
      </div>
    </div>
  );
}

function PartidoEditModal({
  part: initialPart,
  act,
  db,
  onClose,
  onUpd,
  onDel,
  Q,
}) {
  const part = act.partidos.find((p) => p.id === initialPart.id) || initialPart;
  const update = (k, v) => onUpd(part.id, k, v);
  const goles = (act.goles || []).filter((g) => g.matchId === part.id);
  const s1 = (goles || []).filter((g) => g.team === part.eq1).length;
  const s2 = (goles || []).filter((g) => g.team === part.eq2).length;

  const addGoal = async (team) => {
    const tipos = { Fútbol: "f", Handball: "h", Básquet: "b" };
    const tempId = generateTempId();
    const ng = {
      id: tempId,
      pid: null,
      tipo: tipos[part.deporte] || "f",
      matchId: part.id,
      team,
      cant: 1,
    };
    const all = [...(act.goles || []), ng];
    const result = await Q("goal_add", ng, "goles", all);

    // Actualizar con el ID real devuelto por el servidor
    if (result?.id) {
      const updatedGoles = all.map((g) =>
        g.id === tempId ? { ...g, id: result.id } : g,
      );
      update("goles", updatedGoles);
    }

    // Auto result
    const ns1 = all.filter(
      (g) => g.matchId === part.id && g.team === part.eq1,
    ).length;
    const ns2 = all.filter(
      (g) => g.matchId === part.id && g.team === part.eq2,
    ).length;
    let res = "empate";
    if (ns1 > ns2) res = "eq1";
    else if (ns2 > ns1) res = "eq2";
    update("resultado", res);
  };

  const delGoal = (id) => {
    const all = (act.goles || []).filter((g) => g.id !== id);
    Q("goal_remove", { id }, "goles", all);
    const ns1 = all.filter(
      (g) => g.matchId === part.id && g.team === part.eq1,
    ).length;
    const ns2 = all.filter(
      (g) => g.matchId === part.id && g.team === part.eq2,
    ).length;
    let res = "empate";
    if (ns1 > ns2) res = "eq1";
    else if (ns2 > ns1) res = "eq2";
    update("resultado", res);
  };

  const getTeamPlayers = (t) =>
    db.participants.filter(
      (p) =>
        act.asistentes.includes(p.id) &&
        act.equipos?.[p.id] === t &&
        (part.genero === "MX" || p.sexo === part.genero),
    );

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary text-white p-4 flex justify-between items-center">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="w-9 h-9 bg-white/20 text-white hover:bg-white/30"
          >
            ✕
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 opacity-50" />
            <Select
              value={part.deporte}
              onValueChange={(val) => update("deporte", val)}
            >
              <SelectTrigger className="bg-transparent text-white border-none font-black text-base w-auto py-0 px-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPORTES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={async () => {
              if (await confirmDialog("¿Borrar este partido?")) {
                onDel(part.id);
                onClose();
              }
            }}
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-red-400 hover:bg-red-500/20"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 bg-background">
          <div className="flex gap-1 mb-4">
            {["M", "F", "MX"].map((g) => (
              <Button
                key={g}
                onClick={() => update("genero", g)}
                variant={part.genero === g ? "default" : "outline"}
                size="sm"
                className="flex-1 rounded-lg font-bold text-xs"
              >
                {g === "MX" ? "Mixto" : g === "M" ? "Varón" : "Mujer"}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <Select
                value={part.eq1}
                onValueChange={(val) => update("eq1", val)}
              >
                <SelectTrigger
                  className="mb-2 text-center font-black w-full"
                  style={{
                    color: TEAM_COLORS[part.eq1],
                    backgroundColor: getTeamBg(part.eq1),
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.slice(0, act.cantEquipos || 4).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => addGoal(part.eq1)}
                  variant="default"
                  size="icon"
                  className="w-10 h-10 rounded-full font-black text-xl"
                >
                  +
                </Button>
                <span className="text-3xl font-black">{s1}</span>
              </div>
            </div>
            <div className="text-center">
              <Select
                value={part.eq2}
                onValueChange={(val) => update("eq2", val)}
              >
                <SelectTrigger
                  className="mb-2 text-center font-black w-full"
                  style={{
                    color: TEAM_COLORS[part.eq2],
                    backgroundColor: getTeamBg(part.eq2),
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.slice(0, act.cantEquipos || 4).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-black">{s2}</span>
                <Button
                  onClick={() => addGoal(part.eq2)}
                  variant="default"
                  size="icon"
                  className="w-10 h-10 rounded-full font-black text-xl"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-1">
            {[part.eq1, part.eq2].map((t) => (
              <div key={t}>
                <div className="text-[10px] font-bold uppercase text-text-muted mb-1">
                  Goles {t}
                </div>
                {goles
                  .filter((g) => g.team === t)
                  .map((g) => (
                    <div key={g.id} className="flex gap-1 mb-1">
                      <Select
                        value={g.pid?.toString() || ""}
                        onValueChange={(val) =>
                          Q(
                            "goal_update",
                            { id: g.id, pid: val ? Number(val) : null },
                            "goles",
                            act.goles.map((x) =>
                              x.id === g.id
                                ? { ...x, pid: val ? Number(val) : null }
                                : x,
                            ),
                          )
                        }
                      >
                        <SelectTrigger className="flex-1 text-[10px] h-7">
                          <SelectValue placeholder="— Goleador —" />
                        </SelectTrigger>
                        <SelectContent>
                          {getTeamPlayers(t).map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.nombre} {p.apellido[0]}.
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => delGoal(g.id)}
                        variant="destructive"
                        size="icon"
                        className="w-5 h-5 text-[10px]"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
