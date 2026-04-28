"use client";

import { useMemo, useState } from "react";
import { useEditContext } from "../layout";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label, Empty } from "@/components/ui/Common";
import { Plus, Minus, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Gol, ParticipantBasic } from "@/lib/types";

let tempIdCounter = 0;
const generateTempId = () => -1 - tempIdCounter++;

const GOAL_TYPES = [
  { id: "f", label: "Fútbol", short: "F" },
  { id: "h", label: "Handball", short: "H" },
  { id: "b", label: "Básquet", short: "B" },
] as const;

interface GoalRowProps {
  g: Gol;
  availablePlayers: ParticipantBasic[];
  onUpdate: (id: number, key: string, value: unknown) => void;
  onDelete: (id: number) => void;
  onCreate: (tempId: number, goal: Gol) => void;
  locked: boolean;
  openDropdown: number | string | null;
  setOpenDropdown: (id: number | string | null) => void;
}

function GoalRow({
  g,
  availablePlayers,
  onUpdate,
  onDelete,
  onCreate,
  locked,
  openDropdown,
  setOpenDropdown,
}: GoalRowProps) {
  const [search, setSearch] = useState("");
  const selectedPlayer = availablePlayers.find((p) => p.id === g.pid);

  const filteredPlayers = search.trim()
    ? availablePlayers.filter((p) =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase())
      )
    : availablePlayers;

  const handleSelect = (pid: number) => {
    if (g.id === undefined) return;
    if (g.id < 0) {
      onCreate(g.id, { ...g, pid });
    } else {
      onUpdate(g.id, "pid", pid);
    }
    setOpenDropdown(null);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 bg-white rounded-xl border border-surface-dark shadow-sm",
        "transition-all duration-200 hover:border-yellow-400/50"
      )}
    >
      {/* JUGADOR - Popover Selector con Avatar */}
      <div className="flex-1 min-w-0">
        <Popover 
          open={openDropdown === g.id} 
          onOpenChange={(open) => setOpenDropdown(open ? g.id! : null)}
        >
          <PopoverTrigger asChild disabled={locked}>
            <button
              className={cn(
                "flex items-center gap-2 w-full text-left px-2 py-1 rounded-lg",
                "hover:bg-surface-light transition-colors",
                !selectedPlayer && "border border-dashed border-surface-dark py-1.5"
              )}
            >
              {selectedPlayer ? (
                <>
                  <Avatar p={selectedPlayer} size={28} />
                  <span className="text-sm font-medium truncate text-foreground">
                    {selectedPlayer.nombre} {selectedPlayer.apellido}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-surface-dark flex items-center justify-center text-[10px] font-black text-text-muted">
                    ?
                  </div>
                  <span className="text-sm text-text-muted italic">Seleccionar jugador...</span>
                </>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-0 shadow-xl border-surface-dark">
            <div className="p-2 border-b border-surface-dark bg-surface-light/50">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <Input
                  placeholder="Buscar jugador..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs bg-white"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-56 overflow-auto py-1">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-left transition-colors",
                      "hover:bg-yellow-50",
                      p.id === g.pid && "bg-yellow-50/50"
                    )}
                  >
                    <Avatar p={p} size={24} />
                    <span className="text-sm font-medium">
                      {p.nombre} {p.apellido}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-xs text-text-muted italic">
                  No se encontraron jugadores
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* TIPO - Segmented Control (Pills) */}
      <div className="flex bg-surface-dark/50 p-0.5 rounded-lg shrink-0">
        {GOAL_TYPES.map((type) => (
          <button
            key={type.id}
            disabled={locked}
            onClick={() => g.id !== undefined && onUpdate(g.id, "tipo", type.id)}
            className={cn(
              "px-2 py-1 rounded-md text-[10px] font-black transition-all",
              g.tipo === type.id 
                ? "bg-white text-yellow-600 shadow-sm" 
                : "text-text-muted hover:text-text-primary"
            )}
          >
            <span className="hidden sm:inline">{type.label}</span>
            <span className="sm:hidden">{type.short}</span>
          </button>
        ))}
      </div>

      {/* CANTIDAD - Stepper */}
      <div className="flex items-center gap-1 bg-surface-light rounded-lg px-1 shrink-0">
        <button
          disabled={locked || (g.cant || 1) <= 1}
          onClick={() => g.id !== undefined && onUpdate(g.id, "cant", (g.cant || 1) - 1)}
          className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-red-500 disabled:opacity-30 transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-4 text-center text-xs font-black text-text-primary">
          {g.cant || 1}
        </span>
        <button
          disabled={locked}
          onClick={() => g.id !== undefined && onUpdate(g.id, "cant", (g.cant || 1) + 1)}
          className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-teal-500 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* ELIMINAR */}
      <Button
        onClick={() => g.id !== undefined && onDelete(g.id)}
        variant="ghost"
        size="icon"
        disabled={locked}
        className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function GolesPage() {
  const { activity: act, setLocal, syncWithServer, db, locked } = useEditContext();
  const [openDropdown, setOpenDropdown] = useState<number | string | null>(null);
  
  const participants = useMemo(() => {
    // Permitir agregar goles a cualquier asistente, no solo a los que no son social
    return db.participants.filter(
      (p: ParticipantBasic) =>
        act.asistentes.includes(p.id),
    );
  }, [db.participants, act.asistentes]);

  const add = () => {
    const ng: Gol = { id: generateTempId(), pid: null, tipo: "f", cant: 1 };
    setLocal("goles", (prev: Gol[]) => [...(prev || []), ng], true);
    toast.success("Fila de gol agregada");
  };

  const del = async (id: number) => {
    const updateFn = (prev: Gol[]) => (prev || []).filter((g) => g.id !== id);
    if (id < 0) {
      setLocal("goles", updateFn, true);
      return;
    }

    try {
      await syncWithServer("goal_remove", { id }, "goles", updateFn);
      toast.success("Gol eliminado");
    } catch (e) {
      const err = e as Error;
      toast.error("Error al eliminar: " + err.message);
    }
  };

  const upd = async (id: number, k: string, v: unknown) => {
    const updateFn = (prev: Gol[]) => (prev || []).map((g) => (g.id === id ? { ...g, [k]: v } : g));
    
    // Optimistic update
    setLocal("goles", updateFn, true);

    if (id < 0) return;

    try {
      await syncWithServer("goal_update", { id, [k]: v }, "goles", updateFn);
    } catch (e) {
      const err = e as Error;
      toast.error("Error al actualizar: " + err.message);
    }
  };

  const createOnServer = async (tempId: number, goal: Gol) => {
    if (!goal.pid) return;
    const updateFn = (prev: Gol[]) => (prev || []).map(g => g.id === tempId ? goal : g);
    
    try {
      const result = await syncWithServer("goal_add", { pid: goal.pid, tipo: goal.tipo, cant: goal.cant }, "goles", updateFn);
      const realId = (result as { id: number }).id;
      setLocal("goles", (prev: Gol[]) => (prev || []).map(g => g.id === tempId ? { ...g, id: realId } : g), true);
    } catch (e) {
      const err = e as Error;
      toast.error("Error al guardar gol: " + err.message);
    }
  };

  const golesManuales = (act.goles || []).filter((g: Gol) => !g.matchId);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-black text-text-primary">Goles Manuales</h2>
        <Button
          onClick={add}
          variant="ghost"
          size="sm"
          disabled={locked}
          className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar</span>
        </Button>
      </div>

      <div className="space-y-2">
        {golesManuales.length > 0 ? (
          golesManuales.map((g: Gol) => (
            <GoalRow
              key={g.id}
              g={g}
              availablePlayers={participants}
              onUpdate={upd}
              onDelete={del}
              onCreate={createOnServer}
              locked={locked}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-surface-dark rounded-2xl bg-surface-light/30">
            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-sm text-text-muted mb-4">No hay goles registrados</p>
            <Button
              onClick={add}
              variant="outline"
              size="sm"
              disabled={locked}
              className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
            >
              Registrar primer gol
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}