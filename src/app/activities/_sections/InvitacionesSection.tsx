"use client";

import { useState, useMemo } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";

import { Mail, Users, X, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ParticipantBasic } from "@/lib/types";

interface InvitacionWithId {
  id: number;
  invitador: number | null;
  invitadoId: number | null;
}

function findParticipant(participants: ParticipantBasic[], id: number | null) {
  if (!id) return null;
  return participants.find((p) => p.id === id) || null;
}

function InvitationRow({
  inv,
  participants,
  onUpdate,
  onDelete,
  locked,
  openDropdown,
  setOpenDropdown,
}: {
  inv: InvitacionWithId;
  participants: ParticipantBasic[];
  onUpdate: (id: number, key: string, value: unknown) => void;
  onDelete: (id: number) => void;
  locked: boolean;
  openDropdown: number | string | null;
  setOpenDropdown: (id: number | string | null) => void;
}) {
  const [searchFilter, setSearchFilter] = useState("");
  const [searchFilterInvitado, setSearchFilterInvitado] = useState("");

  const invitador = findParticipant(participants, inv.invitador);
  const invitado = findParticipant(participants, inv.invitadoId);

  const filteredInvitadores = searchFilter.trim()
    ? participants.filter((p) =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchFilter.toLowerCase()),
      )
    : participants;

  const filteredInvitados = searchFilterInvitado.trim()
    ? participants.filter((p) =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchFilterInvitado.toLowerCase()),
      )
    : participants;

  const handleSelect = (type: "invitador" | "invitado", participantId: number) => {
    if (type === "invitador") {
      onUpdate(inv.id, "invitador", participantId);
    } else {
      onUpdate(inv.id, "invitadoId", participantId);
    }
    setOpenDropdown(null);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl border border-surface-dark relative transition-all duration-150 hover:border-primary/30">
      <div className="absolute -top-2 left-2 text-[9px] font-black text-primary bg-white px-1 z-0 pointer-events-none">
        INVITA
      </div>
      <div className="absolute -top-2 right-8 text-[9px] font-black text-purple-600 bg-white px-1 z-0 pointer-events-none">
        INVITADO
      </div>
      <div className="flex-1 min-w-0">
        {invitador ? (
          <Popover
            open={openDropdown === `${inv.id}_invitador`}
            onOpenChange={(o) => setOpenDropdown(o ? `${inv.id}_invitador` : null)}
          >
            <PopoverTrigger asChild disabled={locked}>
              <button className="flex items-center gap-2 w-full text-left p-1 -m1 rounded-lg hover:bg-surface-light transition-colors truncate">
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
                {filteredInvitadores.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect("invitador", p.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-surface-light transition-colors",
                      p.id === inv.invitador && "bg-indigo-50",
                    )}
                  >
                    <Avatar p={p} size={24} />
                    <span className="text-sm truncate">{p.nombre} {p.apellido}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Popover
            open={openDropdown === `${inv.id}_invitador`}
            onOpenChange={(o) => setOpenDropdown(o ? `${inv.id}_invitador` : null)}
          >
            <PopoverTrigger asChild disabled={locked}>
              <button className="flex items-center gap-2 w-full text-left p-2 rounded-lg border border-dashed border-surface-dark hover:border-primary/40 hover:bg-indigo-50/30 transition-colors text-sm text-text-muted">
                <div className="w-7 h-7 rounded-full bg-surface-dark flex items-center justify-center text-xs font-black text-text-muted">
                  ?
                </div>
                <span>Quién invita?</span>
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
                {filteredInvitadores.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect("invitador", p.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-surface-light transition-colors"
                  >
                    <Avatar p={p} size={24} />
                    <span className="text-sm truncate">{p.nombre} {p.apellido}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex-shrink-0 text-primary">
        <ArrowRight className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        {invitado ? (
          <Popover
            open={openDropdown === `${inv.id}_invitado`}
            onOpenChange={(o) => setOpenDropdown(o ? `${inv.id}_invitado` : null)}
          >
            <PopoverTrigger asChild disabled={locked}>
              <button className="flex items-center gap-2 w-full text-left p-1 -m1 rounded-lg hover:bg-surface-light transition-colors truncate">
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
                {filteredInvitados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect("invitado", p.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-surface-light transition-colors",
                      p.id === inv.invitadoId && "bg-indigo-50",
                    )}
                  >
                    <Avatar p={p} size={24} />
                    <span className="text-sm truncate">{p.nombre} {p.apellido}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Popover
            open={openDropdown === `${inv.id}_invitado`}
            onOpenChange={(o) => setOpenDropdown(o ? `${inv.id}_invitado` : null)}
          >
            <PopoverTrigger asChild disabled={locked}>
              <button className="flex items-center gap-2 w-full text-left p-2 rounded-lg border border-dashed border-surface-dark hover:border-primary/40 hover:bg-indigo-50/30 transition-colors text-sm text-text-muted">
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
                {filteredInvitados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect("invitado", p.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-surface-light transition-colors"
                  >
                    <Avatar p={p} size={24} />
                    <span className="text-sm truncate">{p.nombre} {p.apellido}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <Button
        onClick={() => onDelete(inv.id)}
        variant="ghost"
        size="icon"
        disabled={locked}
        className="flex-shrink-0 text-red-500 hover:bg-red-50 w-8 h-8"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function InvitacionesSection() {
  const {
    activity,
    db,
    locked,
    isAdmin,
    syncStatus,
    editingSection,
    setEditingSection,
    performQuickUpdate,
  } = useUnifiedActivity();

  const [openDropdown, setOpenDropdown] = useState<number | string | null>(null);
  const [tempIdCounter, setTempIdCounter] = useState(1);
  const [selectedInviter, setSelectedInviter] = useState<number | null>(null);
  const [draftInvitaciones, setDraftInvitaciones] = useState<InvitacionWithId[]>([]);

  const isEditing = editingSection === "invitaciones";
  const participants = db.participants;

  const invitacionesList = useMemo(
    () => (activity.invitaciones || []) as InvitacionWithId[],
    [activity.invitaciones],
  );
  const visibleInvitaciones = [...invitacionesList, ...draftInvitaciones];

  const inviterData = useMemo(() => {
    const counts: Record<number, number> = {};
    const invitedBy: Record<number, number[]> = {};
    invitacionesList.forEach((inv) => {
      if (inv.invitador) {
        counts[inv.invitador] = (counts[inv.invitador] || 0) + 1;
        if (!invitedBy[inv.invitador]) invitedBy[inv.invitador] = [];
        if (inv.invitadoId) invitedBy[inv.invitador].push(inv.invitadoId);
      }
    });
    return { counts, invitedBy };
  }, [invitacionesList]);

  const sortedInviters = useMemo(
    () =>
      Object.entries(inviterData.counts)
        .map(([id, count]) => ({
          id: Number(id),
          count,
          participant: findParticipant(participants, Number(id)),
        }))
        .sort((a, b) => b.count - a.count),
    [inviterData, participants],
  );

  const selectedInviterInvited = useMemo(
    () =>
      (inviterData.invitedBy[selectedInviter || -1] || [])
        .map((pid) => findParticipant(participants, pid))
        .filter(Boolean) as ParticipantBasic[],
    [selectedInviter, inviterData, participants],
  );

  const add = async () => {
    const tempId = -(Date.now() + tempIdCounter);
    setTempIdCounter((prev) => prev + 1);
    setDraftInvitaciones((prev) => [
      ...prev,
      { id: tempId, invitador: null, invitadoId: null },
    ]);
  };

  const del = async (id: number) => {
    if (id < 0) {
      setDraftInvitaciones((prev) => prev.filter((inv) => inv.id !== id));
      return;
    }

    const newList = ((activity.invitaciones || []) as InvitacionWithId[]).filter(
      (i) => i.id !== id,
    );
    try {
      await performQuickUpdate("invitacion_delete", { id, invitaciones: newList }, "invitaciones");
    } catch {
      // Error already handled
    }
  };

  const upd = async (id: number, k: string, v: unknown) => {
    const currentList = [...visibleInvitaciones];
    const oldInv = currentList.find((i) => i.id === id);
    if (!oldInv) return;

    const updatedInv = { ...oldInv, [k]: v } as InvitacionWithId;

    if (id < 0) {
      setDraftInvitaciones((prev) =>
        prev.map((i) => (i.id === id ? updatedInv : i)),
      );

      if (updatedInv.invitador != null && updatedInv.invitadoId != null) {
        try {
          await performQuickUpdate(
            "invitacion_add",
            {
              invitador: updatedInv.invitador,
              invitadoId: updatedInv.invitadoId,
            },
            "invitaciones",
          );
          setDraftInvitaciones((prev) => prev.filter((i) => i.id !== id));
        } catch {
          // Error already handled
        }
      }

      return;
    }

    try {
      await performQuickUpdate(
        "invitacion_update",
        {
          id,
          invitador: updatedInv.invitador,
          invitadoId: updatedInv.invitadoId,
        },
        "invitaciones",
      );
    } catch {
      // Error already handled
    }
  };

  const startEditing = () => setEditingSection("invitaciones");
  const stopEditing = () => setEditingSection(null);

  return (
    <div className="space-y-3">
      {isEditing ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-white">Invitaciones</h2>
            <div className="flex items-center gap-2">
              {syncStatus.state === "saving" && (
                <span className="text-[10px] text-white/60 animate-pulse">Guardando...</span>
              )}
              {syncStatus.state === "error" && syncStatus.message && (
                <span className="text-[10px] text-red-300">{syncStatus.message}</span>
              )}
              <Button
                onClick={add}
                variant="ghost"
                size="sm"
                disabled={locked}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <Plus className="w-4 h-4" />
                <span className="ml-1">Agregar</span>
              </Button>
              <Button onClick={stopEditing} size="sm" variant="ghost" className="font-black bg-white/20 text-white hover:bg-white/30">
                Listo
              </Button>
            </div>
          </div>

          {visibleInvitaciones.length > 0 ? (
            <div className="flex flex-col gap-2">
              {visibleInvitaciones.map((inv) => (
                <InvitationRow
                  key={inv.id}
                  inv={inv}
                  participants={participants}
                  onUpdate={upd}
                  onDelete={del}
                  locked={locked}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-dark flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-text-muted" />
              </div>
              <p className="text-sm text-white/60 mb-3">No hay invitaciones aún</p>
              <Button
                onClick={add}
                variant="outline"
                size="sm"
                disabled={locked}
                className="border-primary/30 text-primary hover:bg-indigo-50"
              >
                Agregar primera invitación
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-white">Invitaciones</h2>
            {isAdmin && (
              <Button onClick={startEditing} variant="ghost" size="sm" className="bg-white/20 text-white hover:bg-white/30">
                Editar
              </Button>
            )}
          </div>

          {sortedInviters.length > 0 ? (
            <div className="flex flex-col gap-1">
              {sortedInviters.map((inviter, i) => (
                <button
                  key={inviter.id}
                  onClick={() => setSelectedInviter(inviter.id)}
                  className="bg-white/90 rounded-xl p-3 flex items-center gap-3 text-left hover:bg-white transition-colors"
                >
                  <div className="w-7 h-7 flex items-center justify-center font-bold text-xs text-text-muted">
                    {i + 1}
                  </div>
                  {inviter.participant && <Avatar p={inviter.participant} size={30} />}
                  <div className="flex-1">
                    <div className="font-bold text-sm">
                      {inviter.participant
                        ? `${inviter.participant.nombre} ${inviter.participant.apellido}`
                        : "Desconocido"}
                    </div>
                  </div>
                  <div className="font-black text-lg">{inviter.count}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-dark flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-text-muted" />
              </div>
              <p className="text-sm text-white/60">No hay invitaciones</p>
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!selectedInviter}
        onOpenChange={(open) => !open && setSelectedInviter(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedInviter
                ? `${findParticipant(participants, selectedInviter)?.nombre || ""} ${findParticipant(participants, selectedInviter)?.apellido || ""} invitó a:`
                : "Invitados"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {selectedInviterInvited.length > 0 ? (
              selectedInviterInvited.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-surface-light"
                >
                  <Avatar p={p} size={32} />
                  <span className="font-medium text-sm">
                    {p.nombre} {p.apellido}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/60 text-center py-4">Sin invitados</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
