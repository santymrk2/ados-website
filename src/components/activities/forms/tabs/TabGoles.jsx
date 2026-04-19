"use client";

import { useMemo } from "react";
import { useToast } from "../../../../hooks/use-toast";
import { Button } from "../../../ui/button";
import { Label, Empty } from "../../../ui/Common";
import { Combobox } from "../../../ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";

let tempIdCounter = 0;
const generateTempId = () => -1 - tempIdCounter++;

export function TabGoles({ act, A, Q, db, locked = false }) {
  const { toast } = useToast();
  const availablePlayers = useMemo(() => {
    return db.participants
      .filter(
        (p) =>
          act.asistentes.includes(p.id) && !(act.socials || []).includes(p.id),
      )
      .map((p) => ({
        value: p.id.toString(),
        label: `${p.nombre} ${p.apellido}`,
      }));
  }, [db.participants, act.asistentes, act.socials]);

  const add = () => {
    const ng = { id: generateTempId(), pid: null, tipo: "f", cant: 1 };
    Q("goal_add", ng, "goles", [...(act.goles || []), ng]);
    toast.success("Gol agregado");
  };
  const del = (id) => {
    Q(
      "goal_remove",
      { id },
      "goles",
      (act.goles || []).filter((g) => g.id !== id),
    );
    toast.success("Gol eliminado");
  };
  const upd = (id, k, v) =>
    Q(
      "goal_update",
      { id, [k]: v },
      "goles",
      (act.goles || []).map((g) => (g.id === id ? { ...g, [k]: v } : g)),
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Label style={{ margin: 0 }}>Goles Manuales</Label>
        <Button
          onClick={add}
          variant="ghost"
          size="sm"
          disabled={locked}
          className="bg-yellow-50 text-yellow-600"
        >
          + Gol
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {(act.goles || [])
          .filter((g) => !g.matchId)
          .map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-xl p-3 border border-surface-dark flex gap-2 items-center shadow-sm"
            >
              <div className="flex-1">
                <Combobox
                  value={g.pid?.toString() || ""}
                  onChange={(val) => upd(g.id, "pid", val ? Number(val) : null)}
                  items={availablePlayers}
                  placeholder="Seleccionar jugador..."
                  disabled={locked}
                />
              </div>
              <div className="w-28">
                <Select
                  value={g.tipo}
                  onValueChange={(val) => upd(g.id, "tipo", val)}
                  disabled={locked}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="f">Fútbol</SelectItem>
                    <SelectItem value="h">Handball</SelectItem>
                    <SelectItem value="b">Básquet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => del(g.id)}
                variant="destructive"
                size="icon"
                disabled={locked}
                className="w-8 h-8"
              >
                ✕
              </Button>
            </div>
          ))}
        {(act.goles || []).filter((g) => !g.matchId).length === 0 && (
          <Empty text="Sin goles manuales" />
        )}
      </div>
    </div>
  );
}
