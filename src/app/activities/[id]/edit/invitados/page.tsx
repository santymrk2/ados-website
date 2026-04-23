"use client";

import { useState } from "react";
import { useEditContext } from "../layout";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ParticipantBasic } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InvitacionWithId {
  id: number;
  invitador: number | null;
  invitadoId: number | null;
}

interface InvitationRowProps {
  inv: InvitacionWithId;
  db: { participants: ParticipantBasic[] };
  asistentes: number[];
  onUpdate: (id: number, key: string, value: unknown) => void;
  onDelete: (id: number) => void;
  locked: boolean;
  openDropdown: number | string | null;
  setOpenDropdown: (id: number | string | null) => void;
}

function getInitials(nombre?: string, apellido?: string) {
  return `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();
}

function findParticipant(participants: ParticipantBasic[], id: number | null) {
  if (!id) return null;
  return participants.find((p) => p.id === id) || null;
}

function InvitationRow({
  inv,
  db,
  asistentes,
  onUpdate,
  onDelete,
  locked,
  openDropdown,
  setOpenDropdown,
}: InvitationRowProps) {
  const participantesList = db?.participants || [];
  const invitador = findParticipant(participantesList, inv.invitador);
  const invitado = findParticipant(participantesList, inv.invitadoId);

  // Estado local para filtrar participantes
  const [searchFilter, setSearchFilter] = useState("");
  const [searchFilterInvitado, setSearchFilterInvitado] = useState("");

  // Solo asistentes pueden ser quien invita (si hay asistentes registrados)
  const safeAsistentes = Array.isArray(asistentes) ? asistentes : [];
  const hasAsistentes = safeAsistentes.length > 0;
  
  const availableInvitadores = hasAsistentes
    ? participantesList.filter((p: ParticipantBasic) => safeAsistentes.includes(p.id))
    : participantesList;
    
  // Cualquier participante puede ser invitado
  const allParticipants = participantesList;
  // Filtrar por búsqueda
  const filteredInvitadores = searchFilter.trim()
    ? availableInvitadores.filter((p: ParticipantBasic) =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : availableInvitadores;
  // Filtrar por búsqueda para invitado
  const filteredInvitados = searchFilterInvitado.trim()
    ? allParticipants.filter((p: ParticipantBasic) =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchFilterInvitado.toLowerCase())
      )
    : allParticipants;

  const handleSelect = (type: "invitador" | "invitado", participantId: number) => {
    if (type === "invitador") {
      onUpdate(inv.id, "invitador", participantId);
    } else {
      onUpdate(inv.id, "invitadoId", participantId);
    }
    setOpenDropdown(null);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-surface-dark relative",
        "transition-all duration-150 hover:border-teal-400/50"
      )}
    >
      {/* Label sutil para clarificar roles */}
      <div className="absolute -top-2 left-2 text-[9px] font-black text-teal-600 bg-white px-1 z-0 pointer-events-none">
        INVITA
      </div>
      <div className="absolute -top-2 right-8 text-[9px] font-black text-purple-600 bg-white px-1 z-0 pointer-events-none">
        INVITADO
      </div>
      {/* QUIEN INVITÓ - Clickable trigger */}
      <div className="flex-1 min-w-0">
        {invitador ? (
          <Popover open={openDropdown === inv.id + "_invitador"} onOpenChange={(o) => setOpenDropdown(o ? inv.id + "_invitador" : null)}>
            <PopoverTrigger asChild disabled={locked}>
              <button
                className={cn(
                  "flex items-center gap-2 w-full text-left",
                  "p-1 -m1 rounded-lg hover:bg-surface-light transition-colors",
                  "truncate"
                )}
                onClick={() => !locked && setOpenDropdown(inv.id + "_invitador")}
              >
                <Avatar p={invitador} size={28} />
                <span className="text-sm font-medium truncate text-foreground">
                  {invitador.nombre} {invitador.apellido}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0">
              <div className="p-2 border-b border-surface-dark">
                <Input
                  placeholder="Buscar..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="max-h-44 overflow-auto">
                {filteredInvitadores.length > 0 ? (
                  filteredInvitadores.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect("invitador", p.id)}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-2 text-left",
                        "hover:bg-surface-light transition-colors",
                        p.id === invitador?.id && "bg-teal-50"
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
                    {searchFilter ? `No results for "${searchFilter}"` : (hasAsistentes
                      ? "No hay asistentes en esta actividad"
                      : "No hay participantes disponibles")}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Popover open={openDropdown === inv.id + "_invitador"} onOpenChange={(o) => setOpenDropdown(o ? inv.id + "_invitador" : null)}>
            <PopoverTrigger asChild disabled={locked}>
              <button
                className={cn(
                  "flex items-center gap-2 w-full text-left",
                  "p-2 rounded-lg border border-dashed border-surface-dark",
                  "hover:border-teal-400 hover:bg-teal-50/30 transition-colors",
                  "text-sm text-text-muted"
                )}
                onClick={() => !locked && setOpenDropdown(inv.id + "_invitador")}
              >
                <div className="w-7 h-7 rounded-full bg-surface-dark flex items-center justify-center text-xs font-black text-text-muted">
                  ?
                </div>
                <span>Quién invita?</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0">
              <div className="max-h-60 overflow-auto">
                {availableInvitadores.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect("invitador", p.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-left",
                      "hover:bg-surface-light transition-colors",
                      p.id === invitador?.id && "bg-teal-50"
                    )}
                  >
                    <Avatar p={p} size={24} />
                    <span className="text-sm truncate">
                      {p.nombre} {p.apellido}
                    </span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* FLECHA DIRECCIONAL - El elemento que comunica la relación */}
      <div className="flex-shrink-0 text-teal-600">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="rotate-0 rtl:rotate-180"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </div>

      {/* INVITADO - Clickable trigger */}
      <div className="flex-1 min-w-0">
        {invitado ? (
          <Popover open={openDropdown === inv.id + "_invitado"} onOpenChange={(o) => setOpenDropdown(o ? inv.id + "_invitado" : null)}>
            <PopoverTrigger asChild disabled={locked}>
              <button
                className={cn(
                  "flex items-center gap-2 w-full text-left",
                  "p-1 -m1 rounded-lg hover:bg-surface-light transition-colors",
                  "truncate"
                )}
                onClick={() => !locked && setOpenDropdown(inv.id + "_invitado")}
              >
                <Avatar p={invitado} size={28} />
                <span className="text-sm font-medium truncate text-foreground">
                  {invitado.nombre} {invitado.apellido}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0">
              <div className="p-2 border-b border-surface-dark">
                <Input
                  placeholder="Buscar..."
                  value={searchFilterInvitado}
                  onChange={(e) => setSearchFilterInvitado(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="max-h-44 overflow-auto">
                {filteredInvitados.length > 0 ? (
                  filteredInvitados.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect("invitado", p.id)}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-2 text-left",
                        "hover:bg-surface-light transition-colors",
                        p.id === invitado?.id && "bg-teal-50"
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
                    {searchFilterInvitado ? `No results for "${searchFilterInvitado}"` : "No hay participantes"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Popover open={openDropdown === inv.id + "_invitado"} onOpenChange={(o) => setOpenDropdown(o ? inv.id + "_invitado" : null)}>
            <PopoverTrigger asChild disabled={locked}>
              <button
                className={cn(
                  "flex items-center gap-2 w-full text-left",
                  "p-2 rounded-lg border border-dashed border-surface-dark",
                  "hover:border-teal-400 hover:bg-teal-50/30 transition-colors",
                  "text-sm text-text-muted"
                )}
                onClick={() => !locked && setOpenDropdown(inv.id + "_invitado")}
              >
                <div className="w-7 h-7 rounded-full bg-surface-dark flex items-center justify-center text-xs font-black text-text-muted">
                  ?
                </div>
                <span>Invitado</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0">
              <div className="p-2 border-b border-surface-dark">
                <Input
                  placeholder="Buscar..."
                  value={searchFilterInvitado}
                  onChange={(e) => setSearchFilterInvitado(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="max-h-44 overflow-auto">
                {filteredInvitados.length > 0 ? (
                  filteredInvitados.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect("invitado", p.id)}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-2 text-left",
                        "hover:bg-surface-light transition-colors",
                        p.id === invitado?.id && "bg-teal-50"
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
                    {searchFilterInvitado ? `No results for "${searchFilterInvitado}"` : "No hay participantes"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* BOTÓN ELIMINAR */}
      <Button
        onClick={() => onDelete(inv.id)}
        variant="ghost"
        size="icon"
        disabled={locked}
        className="flex-shrink-0 text-red-500 hover:bg-red-50 w-8 h-8"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </Button>
    </div>
  );
}

export default function InvitadosPage() {
  const { activity: act, setLocal, syncWithServer, db, locked } = useEditContext();
  const [openDropdown, setOpenDropdown] = useState<number | string | null>(null);
  const [tempIdCounter, setTempIdCounter] = useState(1);

  const invitacionesList = (act.invitaciones || []) as InvitacionWithId[];

  const add = async () => {
    const tempId = -(Date.now() + tempIdCounter);
    setTempIdCounter(prev => prev + 1);
    const currentList = (act.invitaciones || []) as InvitacionWithId[];
    setLocal("invitaciones", [
      ...currentList,
      { id: tempId, invitador: null, invitadoId: null },
    ], true);
    toast.success("Invitación agregada");
  };

  const del = async (id: number) => {
    // Usar la lista más fresca posible
    const currentList = (act.invitaciones || []) as InvitacionWithId[];
    const newList = currentList.filter((i) => i.id !== id);
    
    // Si el ID es negativo, es una invitación temporal (no guardada en DB)
    if (id < 0) {
      setLocal("invitaciones", newList, true);
      toast.success("Invitación eliminada");
      return;
    }

    try {
      await syncWithServer(
        "invitacion_delete",
        { id },
        "invitaciones",
        newList,
      );
      toast.success("Invitación eliminada");
    } catch (e) {
      const err = e as Error;
      toast.error("Error al eliminar invitación: " + err.message);
    }
  };

  const upd = async (id: number, k: string, v: unknown) => {
    const currentList = (act.invitaciones || []) as InvitacionWithId[];
    const inv = currentList.find((i) => i.id === id);
    if (!inv) return;

    // Calcular la nueva lista primero para evitar cierres obsoletos
    const newList = currentList.map((i) => (i.id === id ? { ...i, [k]: v } : i));

    // Actualizar estado local inmediatamente (para UX responsiva)
    // Usamos skipSave=true para evitar el auto-save de toda la actividad (POST)
    setLocal("invitaciones", newList, true);

    // Si la invitación es existente (id > 0), sincronizar con servidor (PATCH atómico)
    if (id > 0) {
      try {
        await syncWithServer(
          "invitacion_update",
          {
            id,
            invitador: k === "invitador" ? v : inv.invitador,
            invitadoId: k === "invitadoId" ? v : inv.invitadoId,
          },
          "invitaciones",
          newList,
        );
        toast.success("Invitación actualizada");
      } catch (e) {
        const err = e as Error;
        toast.error("Error: " + err.message);
      }
      return;
    }

    // Si es invitación nueva (id < 0) Y ya tiene ambos campos, crear en servidor
    const updatedInv = newList.find(i => i.id === id);
    if (updatedInv && updatedInv.invitador && updatedInv.invitadoId) {
      try {
        const result = await syncWithServer(
          "invitacion_add",
          {
            invitador: updatedInv.invitador,
            invitadoId: updatedInv.invitadoId,
          },
          "invitaciones",
          newList,
        );
        
        // Actualizar el ID temporal por el real del servidor
        const finalId = (result as { id: number }).id;
        setLocal(
          "invitaciones",
          newList.map((i) =>
            i.id === id ? { ...i, id: finalId } : i,
          ),
          true
        );
        toast.success("Invitación guardada");
      } catch (e) {
        const err = e as Error;
        toast.error("Error al guardar: " + err.message);
      }
    }
    // Si falta algún campo, solo queda en estado local (se creará cuando esté completo)
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-black text-text-primary">Invitaciones</h2>
        <Button
          onClick={add}
          variant="ghost"
          size="sm"
          disabled={locked}
          className="bg-teal-50 text-teal-600 hover:bg-teal-100"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span className="ml-1">Agregar</span>
        </Button>
      </div>

      {/* Lista de invitaciones */}
      {invitacionesList.length > 0 ? (
        <div className="flex flex-col gap-2">
          {invitacionesList.map((inv) => (
            <InvitationRow
              key={inv.id}
              inv={inv}
              db={db}
              asistentes={act.asistentes}
              onUpdate={upd}
              onDelete={del}
              locked={locked}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />
          ))}
        </div>
      ) : (
        /* Estado vacío */
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-dark flex items-center justify-center mb-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-muted"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-sm text-text-muted mb-3">No hay invitaciones aún</p>
          <Button
            onClick={add}
            variant="outline"
            size="sm"
            disabled={locked}
            className="border-teal-500 text-teal-600 hover:bg-teal-50"
          >
            Agregar primera invitación
          </Button>
        </div>
      )}
    </div>
  );
}