"use client";

import { useState, useMemo, useEffect } from "react";
import { useEditContext, LocalSetter, ServerSync } from "../layout";
import { useApp } from "@/hooks/useApp";
import { toast } from "@/hooks/use-toast";
import {
  X,
  Plus,
  Clock,
  Coffee,
  Zap,
  CalendarCheck,
  CalendarX,
} from "lucide-react";
import {
  getEdad,
  newPart,
} from "@/lib/constants";
import { Label } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/calendar";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Activity, ParticipantBasic, Participant, DBData, Invitacion } from "@/lib/types";

let tempIdCounter = 0;
const generateTempId = () => -1 - tempIdCounter++;

function NewPlayerModal({ act, db, onClose, onSave, setLocal, syncWithServer }: {
  act: Activity;
  db: DBData;
  onClose: () => void;
  onSave: (data: Participant, isNew: boolean, invitadorId?: number | null) => Promise<number>;
  setLocal: LocalSetter;
  syncWithServer: ServerSync;
}) {
  const [newPlayer, setNewPlayer] = useState<{
    nombre: string;
    apellido: string;
    sexo: string;
    fechaNacimiento: string;
    invitadorId: number | null;
  }>({
    nombre: "",
    apellido: "",
    sexo: "M",
    fechaNacimiento: "",
    invitadorId: null,
  });
  const [isSubmittingPlayer, setIsSubmittingPlayer] = useState(false);
  const [invitadorOpen, setInvitadorOpen] = useState(false);
  const [invitadorSearch, setInvitadorSearch] = useState("");

  const allParticipants = useMemo(() => {
    return [...db.participants].sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
    );
  }, [db.participants]);

  const filteredInvitadores = invitadorSearch.trim()
    ? allParticipants.filter((p) =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(invitadorSearch.toLowerCase()),
      )
    : allParticipants;

  const handleCreatePlayer = async () => {
    if (!newPlayer.nombre.trim() || !newPlayer.apellido.trim())
      return toast.error("Ingresá nombre y apellido");
    if (!newPlayer.fechaNacimiento)
      return toast.error("Ingresá la fecha de nacimiento");

    const age = getEdad(newPlayer.fechaNacimiento);
    if (age === null || age < 0 || age > 100)
      return toast.error("La fecha de nacimiento no es válida");
    if (age < 12 || age > 18) {
      if (
        !(await confirmDialog(
          `¿Estás seguro que querés agregar a ${newPlayer.nombre} con ${age} años?`,
          { confirmText: "Agregar", isDestructive: false },
        ))
      )
        return;
    }

    if (isSubmittingPlayer) return;
    setIsSubmittingPlayer(true);
    try {
      const p = { ...newPart(), ...newPlayer, id: db.nextPid };
      const { invitadorId, ...participantData } = p;
      const newId = await onSave(participantData, true, invitadorId);
      const playerId = newId || p.id;

      const updateAsistentes = (prev: number[]) => Array.from(new Set([...(prev || []), playerId]));
      setLocal("asistentes", updateAsistentes, true);
      syncWithServer(
        "attendance",
        { participantId: playerId, value: true },
      );

      if (newPlayer.invitadorId && act.id) {
        syncWithServer(
          "invitacion_add",
          { invitador: Number(newPlayer.invitadorId), invitadoId: playerId },
        );
      } else if (newPlayer.invitadorId) {
        setLocal("invitaciones", (prev: Invitacion[]) => [
          ...(prev || []),
          {
            id: generateTempId(),
            invitador: newPlayer.invitadorId,
            invitadoId: playerId,
          },
        ], true);
      }

      onClose();
    } catch (e) {
      const err = e as Error;
      toast.error("Error al guardar: " + err.message);
    } finally {
      setIsSubmittingPlayer(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm bg-white rounded-3xl p-5 flex flex-col overflow-y-auto max-h-[90vh]"
      >
        <DialogTitle className="sr-only">Nuevo jugador</DialogTitle>
        <DialogDescription className="sr-only">
          Crea un jugador y lo registra como asistente de la actividad.
        </DialogDescription>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-lg text-dark">Nuevo Jugador</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon-sm"
            className="rounded-full bg-surface-dark text-text-muted hover:bg-black/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label className="mb-1">Nombre</Label>
            <Input
              value={newPlayer.nombre}
              onChange={(e) =>
                setNewPlayer((p) => ({ ...p, nombre: e.target.value }))
              }
              placeholder="Nombre"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="mb-1">Apellido</Label>
            <Input
              value={newPlayer.apellido}
              onChange={(e) =>
                setNewPlayer((p) => ({ ...p, apellido: e.target.value }))
              }
              placeholder="Apellido"
              className="text-sm"
            />
          </div>
        </div>

        <div className="mb-4">
          <Label className="mb-1">Fecha de Nacimiento</Label>
          <DatePicker
            value={newPlayer.fechaNacimiento}
            onChange={(date) =>
              setNewPlayer((p) => ({ ...p, fechaNacimiento: date }))
            }
            placeholder="Seleccionar fecha"
            mode="dropdown"
          />
        </div>

        <div className="mb-4">
          <Label className="mb-1">Sexo</Label>
          <div className="flex gap-2">
            <Button
              variant={newPlayer.sexo === "M" ? "default" : "outline"}
              onClick={() => setNewPlayer((p) => ({ ...p, sexo: "M" }))}
              className={cn(
                "flex-1",
                newPlayer.sexo === "M"
                  ? "bg-primary"
                  : "border-surface-dark",
              )}
            >
              Varón
            </Button>
            <Button
              variant={newPlayer.sexo === "F" ? "default" : "outline"}
              onClick={() => setNewPlayer((p) => ({ ...p, sexo: "F" }))}
              className={cn(
                "flex-1",
                newPlayer.sexo === "F"
                  ? "bg-primary"
                  : "border-surface-dark",
              )}
            >
              Mujer
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <Label className="mb-1">¿Quién lo invitó?</Label>
          <Popover open={invitadorOpen} onOpenChange={setInvitadorOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2 w-full text-left",
                  "p-3 rounded-xl border transition-colors text-sm",
                  newPlayer.invitadorId
                    ? "border-border bg-white"
                    : "border-dashed border-border text-text-muted hover:border-teal-400 hover:bg-teal-50/30",
                )}
              >
                {newPlayer.invitadorId ? (
                  (() => {
                    const p = db.participants.find((x) => x.id === newPlayer.invitadorId);
                    return p ? (
                      <>
                        <Avatar p={p} size={24} />
                        <span className="font-medium text-foreground">
                          {p.nombre} {p.apellido}
                        </span>
                      </>
                    ) : (
                      <span>Seleccionar invitador...</span>
                    );
                  })()
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-surface-dark flex items-center justify-center text-xs font-black text-text-muted">
                      ?
                    </div>
                    <span>Seleccionar invitador...</span>
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-0">
              <div className="p-2 border-b border-border">
                <Input
                  placeholder="Buscar participante..."
                  value={invitadorSearch}
                  onChange={(e) => setInvitadorSearch(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="max-h-48 overflow-auto">
                {filteredInvitadores.length > 0 ? (
                  filteredInvitadores.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setNewPlayer((prev) => ({ ...prev, invitadorId: p.id }));
                        setInvitadorOpen(false);
                        setInvitadorSearch("");
                      }}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-2 text-left",
                        "hover:bg-surface-light transition-colors",
                        p.id === newPlayer.invitadorId && "bg-teal-50",
                      )}
                    >
                      <Avatar p={p} size={24} />
                      <span className="text-sm truncate">
                        {p.nombre} {p.apellido}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-xs text-text-muted">
                    {invitadorSearch
                      ? `Sin resultados para "${invitadorSearch}"`
                      : "No hay participantes disponibles"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button
          onClick={handleCreatePlayer}
          disabled={isSubmittingPlayer}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          {isSubmittingPlayer ? "Cargando..." : "Agregar y registrar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function AsistenciaPage() {
  const { activity: act, setLocal, syncWithServer, db, locked, searchQuery, setFilterContent, setFiltersActive } = useEditContext();
  const { saveParticipant } = useApp();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showNewPlayer, setShowNewPlayer] = useState(false);

  // Proveer filtro de orden al FloatingNav
  useEffect(() => {
    setFiltersActive(sortOrder !== "asc");
    setFilterContent(
      <div>
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
          Orden alfabético
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setSortOrder("asc")}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
              sortOrder === "asc"
                ? "bg-primary text-white border-primary"
                : "bg-white text-foreground border-border hover:bg-surface-light",
            )}
          >
            A→Z
          </button>
          <button
            onClick={() => setSortOrder("desc")}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
              sortOrder === "desc"
                ? "bg-primary text-white border-primary"
                : "bg-white text-foreground border-border hover:bg-surface-light",
            )}
          >
            Z→A
          </button>
        </div>
      </div>,
    );
    return () => {
      setFilterContent(null);
      setFiltersActive(false);
    };
  }, [sortOrder, setFilterContent, setFiltersActive]);

  const toggle = async (key: string, id: number) => {
    if (key === "asistentes") {
      const c = act.asistentes || [];
      const isIncluded = c.includes(id);
      const updateFn = (prev: number[]) => {
        const arr = prev || [];
        return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      };
      setLocal("asistentes", updateFn, true);
      await syncWithServer("attendance", { participantId: id, value: !isIncluded });

      if (isIncluded) {
        // Clear all related flags in a single batched update
        setLocal("socials", (prev: number[]) => (prev || []).filter((x) => x !== id), true);
        setLocal("puntuales", (prev: number[]) => (prev || []).filter((x) => x !== id), true);
        setLocal("biblias", (prev: number[]) => (prev || []).filter((x) => x !== id), true);
        setLocal("equipos", (prev: Record<string, string>) => {
          const next = { ...(prev || {}) };
          delete next[id];
          return next;
        }, true);
      }
    } else if (key === "socials") {
      const c = act.socials || [];
      const isIncluded = c.includes(id);
      const updateFn = (prev: number[]) => {
        const arr = prev || [];
        return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      };
      setLocal("socials", updateFn, true);
      await syncWithServer("socials", { participantId: id, value: !isIncluded });
      setLocal("equipos", (prev: Record<string, string>) => {
        const next = { ...(prev || {}) };
        delete next[id];
        return next;
      }, true);
    } else if (key === "puntuales") {
      const c = act.puntuales || [];
      const isIncluded = c.includes(id);
      const updateFn = (prev: number[]) => {
        const arr = prev || [];
        return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      };

      // Si marca como puntual, también marca como presente automáticamente
      if (!isIncluded && !act.asistentes.includes(id)) {
        const asistUpdateFn = (prev: number[]) => [...(prev || []), id];
        setLocal("asistentes", asistUpdateFn, true);
        await syncWithServer("attendance", { participantId: id, value: true });
      }

      setLocal("puntuales", updateFn, true);
      await syncWithServer("puntuales", { participantId: id, value: !isIncluded });
    } else if (key === "biblias") {
      const c = act.biblias || [];
      const isIncluded = c.includes(id);
      const updateFn = (prev: number[]) => {
        const arr = prev || [];
        return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      };
      setLocal("biblias", updateFn, true);
      await syncWithServer("biblias", { participantId: id, value: !isIncluded });
    }
  };

  const sorted = useMemo<ParticipantBasic[]>(() => {
    let arr: ParticipantBasic[] = [...db.participants];
    if (searchQuery) {
      arr = arr.filter((p) =>
        `${p.nombre} ${p.apellido}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      );
    }
    if (sortOrder === "asc") {
      arr.sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
      );
    } else {
      arr.sort((a, b) =>
        `${b.apellido} ${b.nombre}`.localeCompare(`${a.apellido} ${a.nombre}`),
      );
    }
    return arr;
  }, [db.participants, sortOrder, searchQuery]);

  return (
    <div>
      {showNewPlayer && (
        <NewPlayerModal
          act={act}
          db={db}
          onClose={() => setShowNewPlayer(false)}
          onSave={saveParticipant}
          setLocal={setLocal}
          syncWithServer={syncWithServer}
        />
      )}

      <div className="flex items-center gap-2 mb-4">
        <Label style={{ margin: 0 }}>
          Asistencia
          {searchQuery && (
            <span className="text-text-muted text-xs font-normal ml-1">
              (filtrado: {sorted.length})
            </span>
          )}
        </Label>
        <div className="flex gap-1 ml-auto">
          <Button
            onClick={() => setShowNewPlayer(true)}
            variant="ghost"
            size="sm"
            disabled={locked}
            className="bg-primary/10 text-primary text-xs flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Nuevo Jugador
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {sorted.map((p: ParticipantBasic) => {
          const here = act.asistentes.includes(p.id);
          const punct = (act.puntuales || []).includes(p.id);
          return (
            <div
              key={p.id}
              className={`rounded-lg border bg-white ${here ? "border-primary shadow-md shadow-primary/20" : "border-surface-dark"}`}
            >
              <div className="flex items-center p-3 gap-2">
                <div className="flex gap-0">
                  <button
                    onClick={() => toggle("asistentes", p.id)}
                    disabled={locked}
                    className={cn(
                      "flex items-center justify-center h-9 min-w-9 px-2 text-sm font-semibold transition-colors",
                      locked && "opacity-50 cursor-not-allowed pointer-events-none",
                    )}
                    style={{
                      backgroundColor: here ? "var(--color-primary)" : "#f5f5f5",
                      border: `1px solid ${here ? "var(--color-primary)" : "#e5e5e5"}`,
                      borderRight: "none",
                      color: here ? "var(--color-primary-foreground)" : "#999",
                      borderRadius: "12px 0 0 12px",
                    }}
                  >
                    {here ? <CalendarCheck className="w-3.5 h-3.5" /> : <CalendarX className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => toggle("puntuales", p.id)}
                    disabled={locked}
                    className={cn(
                      "flex items-center justify-center h-9 min-w-9 px-2 text-sm font-semibold transition-colors",
                      locked && "opacity-50 cursor-not-allowed pointer-events-none",
                    )}
                    style={{
                      backgroundColor: punct ? "var(--color-primary)" : "#f5f5f5",
                      border: `1px solid ${punct ? "var(--color-primary)" : "#e5e5e5"}`,
                      color: punct ? "var(--color-primary-foreground)" : "#999",
                      borderRadius: "0 12px 12px 0",
                    }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Avatar p={p} size={30} />
                <div className="flex-1">
                  <div
                    className="font-bold text-sm"
                    style={{ color: here ? "#1a1a1a" : "#999" }}
                  >
                    {p.nombre} {p.apellido}
                  </div>
                  <div className="text-xs text-text-muted">
                    {getEdad(p.fechaNacimiento)}a
                  </div>
                </div>
                {here && (
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => toggle("socials", p.id)}
                      disabled={locked}
                      className={cn(
                        "flex items-center gap-1 h-9 min-w-9 px-3 text-sm font-semibold transition-colors",
                        locked && "opacity-50 cursor-not-allowed pointer-events-none",
                      )}
                      style={{
                        backgroundColor: (act.socials || []).includes(p.id)
                          ? "#F59E0B33"
                          : "color-mix(in srgb, var(--color-primary) 20%, transparent)",
                        border: (act.socials || []).includes(p.id)
                          ? "1px solid #F59E0B66"
                          : "1px solid color-mix(in srgb, var(--color-primary) 40%, transparent)",
                        color: (act.socials || []).includes(p.id)
                          ? "#F59E0B"
                          : "var(--color-primary)",
                        borderRadius: "12px",
                      }}
                    >
                      {(act.socials || []).includes(p.id) ? <Coffee className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                      <span className="text-xs font-medium">
                        {(act.socials || []).includes(p.id) ? "Social" : "Juegos"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
