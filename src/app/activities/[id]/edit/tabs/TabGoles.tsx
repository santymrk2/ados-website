"use client";

import { useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label, Empty } from "@/components/ui/Common";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Activity, Gol, ParticipantBasic, AppState } from "@/lib/types";

let tempIdCounter = 0;
const generateTempId = () => -1 - tempIdCounter++;

type ActionFn = (key: string, value: unknown) => void;
type QueryFn = (key: string, data: unknown, target: string, value: unknown) => Promise<unknown>;

export function TabGoles({
  act,
  A,
  Q,
  db,
  locked = false,
  savingOps,
  onSaveParticipant,
}: {
  act: Activity;
  A: ActionFn;
  Q: QueryFn;
  db: AppState;
  locked?: boolean;
  savingOps?: Set<string>;
  onSaveParticipant?: (data: unknown, isNew: boolean, invitadorId?: string | null) => Promise<number>;
}) {
  const availablePlayers = useMemo(() => {
    return db.participants
      .filter(
        (p: ParticipantBasic) =>
          act.asistentes.includes(p.id) && !(act.socials || []).includes(p.id),
      )
      .map((p: ParticipantBasic) => ({
        value: p.id.toString(),
        label: `${p.nombre} ${p.apellido}`,
      }));
  }, [db.participants, act.asistentes, act.socials]);

  const getParticipantLabel = (id: number) => {
    if (!id) return "";
    const p = db.participants.find((p) => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : "";
  };

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
          .filter((g: Gol) => !g.matchId)
          .map((g: Gol) => (
            <div
              key={g.id}
              className="bg-white rounded-xl p-3 border border-surface-dark flex gap-2 items-center shadow-sm"
            >
              <div className="flex-1">
                <Combobox
                  value={g.pid?.toString() || ""}
                  onValueChange={(val) =>
                    upd(g.id, "pid", val ? Number(val) : null)
                  }
                  items={availablePlayers}
                  disabled={locked}
                >
                  <ComboboxInput placeholder="Seleccionar jugador..." />
                  <ComboboxValue>
                    {({ value }) =>
                      value
                        ? getParticipantLabel(Number(value))
                        : "Seleccionar jugador..."
                    }
                  </ComboboxValue>
                  <ComboboxContent>
                    <ComboboxList>
                      {availablePlayers.map((p: { value: string; label: string }) => (
                        <ComboboxItem key={p.value} value={p.value}>
                          {p.label}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
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
