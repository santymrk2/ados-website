"use client";

import { useState, useMemo, useEffect } from "react";
import { useEditContext } from "../layout";
import { toast } from "@/hooks/use-toast";
import { Plus, Minus, Trash2, Search, User, Users as UsersIcon, Zap, List } from "lucide-react";
import { TEAMS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Extra, ParticipantBasic, DBData } from "@/lib/types";

interface ExtraResult {
  id: number;
  participantId?: number | null;
  team?: string | null;
}

interface ExtraWithId extends Extra {
  id: number;
  scope?: "ind" | "team";
}

interface ExtraRowProps {
  item: ExtraWithId;
  db: DBData;
  isTeam: boolean;
  onUpdate: (id: number, key: string, value: unknown) => void;
  onDelete: (id: number) => void;
  onCreate: (tempId: number, extra: ExtraWithId) => void;
  locked: boolean;
  openDropdown: number | string | null;
  setOpenDropdown: (id: number | string | null) => void;
  availablePlayers: ParticipantBasic[];
  activeTeams: string[];
}

function ExtraRow({
  item,
  db,
  isTeam,
  onUpdate,
  onDelete,
  onCreate,
  locked,
  openDropdown,
  setOpenDropdown,
  availablePlayers,
  activeTeams,
}: ExtraRowProps) {
  const [search, setSearch] = useState("");
  const [localMotivo, setLocalMotivo] = useState(item.motivo || "");
  const selectedPlayer = !isTeam ? availablePlayers.find((p) => p.id === item.pid) : null;
  const color = item.tipo === "extra" ? "#22C55E" : "#FF6B6B";

  const filteredPlayers = search.trim()
    ? availablePlayers.filter((p) =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase())
      )
    : availablePlayers;

  // Debounce motive update
  useEffect(() => {
    if (localMotivo === (item.motivo || "")) return;
    const timer = setTimeout(() => {
      onUpdate(item.id, "motivo", localMotivo);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localMotivo, item.id, item.motivo]); // Omit onUpdate to prevent re-runs

  // Sync local state if parent state changes (e.g. from server)
  useEffect(() => {
    setLocalMotivo(item.motivo || "");
  }, [item.motivo]);

  const handleSelect = (pid: number) => {
    if (item.id < 0) {
      onCreate(item.id, { ...item, pid, team: undefined, motivo: localMotivo });
    } else {
      onUpdate(item.id, "pid", pid);
    }
    setOpenDropdown(null);
  };

  const handleSelectTeam = (team: string) => {
    if (item.id < 0) {
      onCreate(item.id, { ...item, team, pid: null, motivo: localMotivo });
    } else {
      onUpdate(item.id, "team", team);
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
      <div className="flex-[1.5] min-w-0">
        <Popover 
          open={openDropdown === item.id} 
          onOpenChange={(open) => setOpenDropdown(open ? item.id : null)}
        >
          <PopoverTrigger asChild disabled={locked}>
            <button
              className={cn(
                "flex items-center gap-2 w-full text-left px-2 py-1 rounded-lg",
                "hover:bg-surface-light transition-colors",
                ((isTeam && !item.team) || (!isTeam && !selectedPlayer)) && "border border-dashed border-surface-dark py-1.5"
              )}
            >
              {isTeam ? (
                item.team ? (
                  <>
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs"
                      style={{ backgroundColor: TEAM_COLORS[item.team] }}
                    >
                      {item.team}
                    </div>
                    <span className="text-sm font-medium truncate" style={{ color: TEAM_COLORS[item.team] }}>
                      Equipo {item.team}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-text-muted italic px-1">Elegir equipo...</span>
                )
              ) : selectedPlayer ? (
                <>
                  <Avatar p={selectedPlayer} size={28} />
                  <span className="text-sm font-medium truncate">
                    {selectedPlayer.nombre} {selectedPlayer.apellido}
                  </span>
                </>
              ) : (
                <span className="text-xs text-text-muted italic px-1">Elegir persona...</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-0 shadow-xl border-surface-dark">
            {isTeam ? (
              <div className="grid grid-cols-2 gap-1 p-2">
                {activeTeams.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSelectTeam(t)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-light transition-colors"
                  >
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center font-black text-white text-[10px]"
                      style={{ backgroundColor: TEAM_COLORS[t] }}
                    >
                      {t}
                    </div>
                    <span className="text-xs font-bold" style={{ color: TEAM_COLORS[t] }}>Equipo {t}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="p-2 border-b border-surface-dark bg-surface-light/50">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                    <Input
                      placeholder="Buscar persona..."
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
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-yellow-50 transition-colors"
                      >
                        <Avatar p={p} size={24} />
                        <span className="text-xs font-medium">{p.nombre} {p.apellido}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-[10px] text-text-muted italic">No hay resultados</div>
                  )}
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-[2] min-w-0">
        <Input
          placeholder="Motivo..."
          value={localMotivo}
          disabled={locked || item.id < 0}
          onChange={(e) => setLocalMotivo(e.target.value)}
          className="h-8 text-xs bg-transparent border-none shadow-none focus-visible:ring-0 p-0"
        />
      </div>

      <div className="flex items-center gap-1 bg-surface-light rounded-lg px-1 shrink-0">
        <button
          disabled={locked || item.id < 0}
          onClick={() => onUpdate(item.id, "puntos", Math.max(0, (item.puntos || 0) - 1))}
          className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-red-500 transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span 
          className="w-5 text-center text-[11px] font-black"
          style={{ color }}
        >
          {item.puntos > 0 && item.tipo === "extra" ? "+" : ""}{item.puntos}
        </span>
        <button
          disabled={locked || item.id < 0}
          onClick={() => onUpdate(item.id, "puntos", (item.puntos || 0) + 1)}
          className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-teal-500 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <Button
        onClick={() => onDelete(item.id)}
        variant="ghost"
        size="icon"
        disabled={locked}
        className="w-8 h-8 text-red-400 hover:bg-red-50 hover:text-red-500"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function ExtrasPage() {
  const { activity: act, setLocal, syncWithServer, db, locked } = useEditContext();
  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState<number | string | null>(null);

  const availablePlayers = useMemo(() => {
    return db.participants
      .filter(
        (p: ParticipantBasic) =>
          act.asistentes.includes(p.id) && !(act.socials || []).includes(p.id),
      )
      .sort((a: ParticipantBasic, b: ParticipantBasic) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)
      );
  }, [db.participants, act.asistentes, act.socials]);

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return availablePlayers;
    return availablePlayers.filter((p: ParticipantBasic) => 
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [availablePlayers, search]);

  const activeTeams = useMemo(() => {
    return TEAMS.slice(0, act.cantEquipos || 4);
  }, [act.cantEquipos]);


  const del = async (id: number, listKey: "extras" | "descuentos") => {
    const updateFn = (prev: Extra[]) => (prev || []).filter((e) => e.id !== id);
    
    if (id < 0) {
      setLocal(listKey, updateFn, true);
      return;
    }

    try {
      await syncWithServer("extra_delete", { id }, listKey, updateFn);
      toast.success("Eliminado");
    } catch (e) {
      const err = e as Error;
      toast.error("Error: " + err.message);
    }
  };

  const upd = async (id: number, listKey: "extras" | "descuentos", k: string, v: unknown) => {
    const updateFn = (prev: Extra[]) => (prev || []).map((e) => (e.id === id ? { ...e, [k]: v } : e));
    
    setLocal(listKey, updateFn, true);

    if (id < 0) return;

    try {
      const item = (act[listKey] || []).find(e => e.id === id);
      if (!item) return;
      await syncWithServer("extra_update", { 
        id, 
        pid: k === "pid" ? v : item.pid,
        team: k === "team" ? v : item.team,
        puntos: k === "puntos" ? v : item.puntos,
        motivo: k === "motivo" ? v : item.motivo,
      }, listKey, updateFn);
    } catch (e) {
      const err = e as Error;
      toast.error("Error: " + err.message);
    }
  };

  const createOnServer = async (tempId: number, listKey: "extras" | "descuentos", extra: ExtraWithId) => {
    const updateFn = (prev: Extra[]) => (prev || []).map(e => e.id === tempId ? extra : e);

    try {
      const result = await syncWithServer("extra_add", {
        pid: extra.pid,
        team: extra.team,
        tipo: extra.tipo,
        puntos: extra.puntos,
        motivo: extra.motivo,
      }, listKey, updateFn);
      
      const resultTyped = result as ExtraResult;
      const realId = resultTyped.id;
      const finalPid = resultTyped.participantId ?? extra.pid;
      const finalTeam = resultTyped.team ?? extra.team;

      setLocal(listKey, (prev: Extra[]) => (prev || []).map((e) => 
        e.id === tempId ? { ...e, id: realId, pid: finalPid, team: finalTeam } : e
      ), true);
      toast.success("Guardado");
    } catch (e) {
      const err = e as Error;
      toast.error("Error al guardar: " + err.message);
      // Cleanup zombies
      setLocal(listKey, (prev: Extra[]) => (prev || []).filter((e) => e.id !== tempId), true);
    }
  };

  const fastAdd = async (pid: number | null, team: string | null, tipo: "extra" | "descuento") => {
    const listKey = tipo === "extra" ? "extras" : "descuentos";
    const tempId = (Date.now() + Math.floor(Math.random() * 1000)) * -1;
    const newItem: ExtraWithId = {
      id: tempId,
      puntos: 1,
      motivo: tipo === "extra" ? "Premio" : "Sanción",
      tipo,
      pid,
      team,
      scope: team ? "team" : "ind",
    };
    
    const addFn = (prev: Extra[]) => [...(prev || []), newItem];
    setLocal(listKey, addFn, true);
    
    try {
      const result = await syncWithServer("extra_add", {
        pid,
        team,
        tipo,
        puntos: 1,
        motivo: newItem.motivo,
      }, listKey, addFn);
      
      const resultTyped = result as ExtraResult;
      const realId = resultTyped.id;
      setLocal(listKey, (prev: Extra[]) => (prev || []).map((e) => 
        e.id === tempId ? { ...e, id: realId } : e
      ), true);
      toast.success("Agregado");
    } catch (e) {
      toast.error("Error al agregar");
      setLocal(listKey, (prev: Extra[]) => (prev || []).filter((e) => e.id !== tempId), true);
    }
  };

  const extrasList = useMemo(() => 
    ((act.extras || []) as ExtraWithId[]).map(e => ({ ...e, tipo: "extra" as const })),
    [act.extras]
  );
  const descuentosList = useMemo(() => 
    ((act.descuentos || []) as ExtraWithId[]).map(e => ({ ...e, tipo: "descuento" as const })),
    [act.descuentos]
  );

  const filteredE = extrasList;
  const filteredD = descuentosList;
  return (
    <div className="space-y-8 pb-10">
      {/* Sección Equipos (Superior) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <span className="text-xs font-black uppercase tracking-widest text-primary">Equipos</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {activeTeams.map((t) => {
            const tExtras = filteredE.filter(x => x.team === t);
            const tDescs = filteredD.filter(x => x.team === t);
            const total = tExtras.reduce((s, x) => s + x.puntos, 0) - tDescs.reduce((s, x) => s + x.puntos, 0);

            return (
              <div 
                key={t} 
                className="rounded-3xl p-4 flex flex-col gap-3 border-2 transition-all relative shadow-sm"
                style={{ 
                  backgroundColor: getTeamBg(t),
                  borderColor: TEAM_COLORS[t] + "44"
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-inner" style={{ backgroundColor: TEAM_COLORS[t] }}>
                    {t}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black opacity-60 uppercase">Puntos</div>
                    <div className="text-xl font-black" style={{ color: TEAM_COLORS[t] }}>
                      {total > 0 ? "+" : ""}{total}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => fastAdd(null, t, "descuento")} 
                    size="sm" 
                    className="flex-1 h-9 rounded-xl bg-white/50 hover:bg-white/80 border-none text-red-700 font-black"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={() => fastAdd(null, t, "extra")} 
                    size="sm" 
                    className="flex-1 h-9 rounded-xl bg-white/50 hover:bg-white/80 border-none text-green-700 font-black"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección Individuales (Inferior) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">Individuales</span>
          </div>
          <span className="text-[10px] font-bold text-text-muted">{filteredPlayers.length} personas</span>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input 
              placeholder="Buscar participante..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white border-surface-dark rounded-xl"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {filteredPlayers.map((p) => {
              const pExtras = filteredE.filter(x => x.pid === p.id);
              const pDescs = filteredD.filter(x => x.pid === p.id);
              const total = pExtras.reduce((s, x) => s + x.puntos, 0) - pDescs.reduce((s, x) => s + x.puntos, 0);

              return (
                <div 
                  key={p.id}
                  className="bg-white rounded-2xl p-3 flex items-center gap-3 border border-surface-dark shadow-sm"
                >
                  <Avatar p={p} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{p.nombre} {p.apellido}</div>
                    <div className="text-[10px] font-black text-text-muted uppercase">
                      Balance: <span className={cn(total > 0 ? "text-green-600" : total < 0 ? "text-red-600" : "")}>
                        {total > 0 ? "+" : ""}{total} pts
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={() => fastAdd(p.id, null, "descuento")} size="icon" variant="ghost" className="h-9 w-9 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl">
                      <Minus className="w-5 h-5" />
                    </Button>
                    <Button onClick={() => fastAdd(p.id, null, "extra")} size="icon" variant="ghost" className="h-9 w-9 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
