"use client";

import { useState, useMemo } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";
import { useApp } from "@/hooks/useApp";
import { toast } from "@/hooks/use-toast";
import { getEdad, newPart } from "@/lib/constants";
import { actPts } from "@/lib/calc";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/Common";
import { cn } from "@/lib/utils";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { PlayerPointsModal } from "@/app/activities/_components/PlayerPointsModal";
import {
  Users as PlayersIcon,
  Clock,
  Coffee,
  Zap,
  CalendarCheck,
  CalendarX,
  Pencil,
  X,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ParticipantBasic } from "@/lib/types";

function NewPlayerModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { db, performQuickUpdate } = useUnifiedActivity();
  const { saveParticipant } = useApp();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    sexo: "M",
    fechaNacimiento: "",
    invitadorId: null as number | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitadorOpen, setInvitadorOpen] = useState(false);
  const [invitadorSearch, setInvitadorSearch] = useState("");

  const allParticipants = useMemo(
    () =>
      [...db.participants].sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
      ),
    [db.participants],
  );

  const filteredInvitadores = invitadorSearch.trim()
    ? allParticipants.filter((p) =>
        `${p.nombre} ${p.apellido}`
          .toLowerCase()
          .includes(invitadorSearch.toLowerCase()),
      )
    : allParticipants;

  const handleCreate = async () => {
    if (!form.nombre.trim() || !form.apellido.trim())
      return toast.error("Ingresá nombre y apellido");
    if (!form.fechaNacimiento) return toast.error("Ingresá la fecha de nacimiento");

    const age = getEdad(form.fechaNacimiento);
    if (age !== null && (age < 12 || age > 18)) {
      const ok = await confirmDialog(
        `¿Estás seguro que querés agregar a ${form.nombre} con ${age} años?`,
        { confirmText: "Agregar", isDestructive: false },
      );
      if (!ok) return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const p = { ...newPart(), ...form, id: db.nextPid };
      const { invitadorId, ...participantData } = p;
      const newId = await saveParticipant(participantData, true, invitadorId);
      const playerId = newId || p.id;

      await performQuickUpdate("attendance", {
        participantId: playerId,
        value: true,
      });

      if (form.invitadorId) {
        await performQuickUpdate("invitacion_add", {
          invitador: form.invitadorId,
          invitadoId: playerId,
        });
      }

      onClose();
    } catch {
      // Error already handled by performQuickUpdate or saveParticipant
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm bg-white rounded-3xl p-5 flex flex-col overflow-y-auto max-h-[90vh]"
      >
        <DialogTitle className="sr-only">Nuevo jugador</DialogTitle>
        <DialogDescription className="sr-only">
          Crea un jugador y lo registra como asistente
        </DialogDescription>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-lg text-foreground">
            Nuevo Jugador
          </h3>
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
              value={form.nombre}
              onChange={(e) =>
                setForm((p) => ({ ...p, nombre: e.target.value }))
              }
              placeholder="Nombre"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="mb-1">Apellido</Label>
            <Input
              value={form.apellido}
              onChange={(e) =>
                setForm((p) => ({ ...p, apellido: e.target.value }))
              }
              placeholder="Apellido"
              className="text-sm"
            />
          </div>
        </div>
        <div className="mb-4">
          <Label className="mb-1">Fecha de Nacimiento</Label>
          <DatePicker
            value={form.fechaNacimiento}
            onChange={(date) =>
              setForm((p) => ({ ...p, fechaNacimiento: date }))
            }
            placeholder="Seleccionar fecha"
            mode="dropdown"
          />
        </div>
        <div className="mb-4">
          <Label className="mb-1">Sexo</Label>
          <div className="flex gap-2">
            <Button
              variant={form.sexo === "M" ? "default" : "outline"}
              onClick={() => setForm((p) => ({ ...p, sexo: "M" }))}
              className={cn(
                "flex-1",
                form.sexo === "M" ? "bg-primary" : "border-surface-dark",
              )}
            >
              Varón
            </Button>
            <Button
              variant={form.sexo === "F" ? "default" : "outline"}
              onClick={() => setForm((p) => ({ ...p, sexo: "F" }))}
              className={cn(
                "flex-1",
                form.sexo === "F" ? "bg-primary" : "border-surface-dark",
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
                  form.invitadorId
                    ? "border-border bg-white"
                    : "border-dashed border-border text-text-muted hover:border-teal-400 hover:bg-teal-50/30",
                )}
              >
                {form.invitadorId
                  ? (() => {
                      const p = db.participants.find(
                        (x) => x.id === form.invitadorId,
                      );
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
                  : (
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
                {filteredInvitadores.length > 0
                  ? (
                    filteredInvitadores.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setForm((prev) => ({ ...prev, invitadorId: p.id }));
                          setInvitadorOpen(false);
                          setInvitadorSearch("");
                        }}
                        className={cn(
                          "flex items-center gap-2 w-full px-3 py-2 text-left",
                          "hover:bg-surface-light transition-colors",
                          p.id === form.invitadorId && "bg-teal-50",
                        )}
                      >
                        <Avatar p={p} size={24} />
                        <span className="text-sm truncate">
                          {p.nombre} {p.apellido}
                        </span>
                      </button>
                    ))
                  )
                  : (
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
          onClick={handleCreate}
          disabled={isSubmitting}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          {isSubmitting ? "Cargando..." : "Agregar y registrar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function AsistenciaSection() {
  const {
    activity: act,
    db,
    isAdmin,
    locked,
    searchQuery,
    performQuickUpdate,
  } = useUnifiedActivity();
  const [editing, setEditing] = useState(false);
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<ParticipantBasic | null>(
    null,
  );

  const canEdit = isAdmin && !locked;

  const stats = useMemo(() => {
    if (!act) {
      return { total: 0, males: 0, females: 0, puntuales: 0, juegos: 0, social: 0 };
    }
    const total = act.asistentes.length;
    let males = 0;
    let females = 0;
    let puntuales = 0;
    const social = act.socials?.length || 0;
    const juegos = total - social;

    act.asistentes.forEach((pid) => {
      const p = db.participants.find((x) => x.id === pid);
      if (p) {
        if (p.sexo === "M") males++;
        else if (p.sexo === "F") females++;
      }
      if (act.puntuales.includes(pid)) puntuales++;
    });

    return { total, males, females, puntuales, juegos, social };
  }, [act, act?.asistentes, act?.puntuales, act?.socials, db.participants]);

  const filteredAsistentes = useMemo(() => {
    if (!act) return [];
    const query = searchQuery.toLowerCase().trim();
    const enriched: (ParticipantBasic & { edad: number })[] = [];
    for (const pid of act.asistentes) {
      const p = db.participants.find((x) => x.id === pid);
      if (!p) continue;
      const edad = getEdad(p.fechaNacimiento);
      if (edad === null) continue;
      if (query) {
        const name = `${p.nombre} ${p.apellido}`.toLowerCase();
        if (!name.includes(query)) continue;
      }
      enriched.push({ ...p, edad });
    }
    enriched.sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
    );
    return enriched;
  }, [act, act?.asistentes, db.participants, searchQuery]);

  const sortedAll = useMemo(() => {
    let arr = [...db.participants];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter((p) =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(q),
      );
    }
    arr.sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
    );
    return arr;
  }, [db.participants, searchQuery]);

  const playerPts = useMemo(() => {
    const pts: Record<number, number> = {};
    if (act) {
      for (const pid of act.asistentes) {
        pts[pid] = actPts(pid, act, db.participants);
      }
    }
    return pts;
  }, [act, act?.asistentes, db.participants]);

  const toggleAttendance = async (id: number) => {
    const isPresent = act.asistentes.includes(id);

    if (isPresent) {
      const hasGoals = act.goles?.some((g) => g.pid === id);
      const hasExtras = act.extras?.some((e) => e.pid === id);
      if (hasGoals || hasExtras) {
        const ok = await confirmDialog(
          "Este jugador tiene goles o puntos extra registrados. ¿Estás seguro de eliminar su asistencia?",
          {
            title: "Eliminar asistencia",
            confirmText: "Eliminar",
            isDestructive: true,
          },
        );
        if (!ok) return;
      }
    }

    try {
      await performQuickUpdate("attendance", {
        participantId: id,
        value: !isPresent,
      });
    } catch {
      // Error already handled by performQuickUpdate
    }
  };

  const togglePunctual = async (id: number) => {
    const isPunctual = (act.puntuales || []).includes(id);

    if (!isPunctual && !act.asistentes.includes(id)) {
      try {
        await performQuickUpdate("attendance", {
          participantId: id,
          value: true,
        });
        await performQuickUpdate("puntuales", {
          participantId: id,
          value: true,
        });
      } catch {
        // Error already handled by performQuickUpdate
      }
    } else {
      try {
        await performQuickUpdate("puntuales", {
          participantId: id,
          value: !isPunctual,
        });
      } catch {
        // Error already handled by performQuickUpdate
      }
    }
  };

  const toggleSocial = async (id: number) => {
    const isSocial = (act.socials || []).includes(id);

    if (!isSocial && act.equipos?.[String(id)]) {
      const ok = await confirmDialog(
        "Al cambiar a Social, el equipo y los puntos acumulados en juegos se perderán.",
        {
          title: "Cambiar a Social",
          confirmText: "Cambiar",
          isDestructive: true,
        },
      );
      if (!ok) return;
    }

    try {
      await performQuickUpdate("socials", {
        participantId: id,
        value: !isSocial,
      });
    } catch {
      // Error already handled by performQuickUpdate
    }
  };

  return (
    <div>
      {canEdit && !editing && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setEditing(true)}
            variant="ghost"
            size="sm"
            className="gap-1 bg-white/20 text-white hover:bg-white/30"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Button>
        </div>
      )}
      {editing && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setEditing(false)}
            variant="ghost"
            size="sm"
            className="bg-white/20 text-white hover:bg-white/30"
          >
            Listo
          </Button>
        </div>
      )}

      {!editing && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-white/20 rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl font-black text-accent">
                {stats.total}
              </div>
              <div className="text-xs font-bold opacity-60 text-accent flex items-center justify-center gap-1">
                <PlayersIcon className="w-3 h-3" /> Total
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl font-black text-accent">
                {stats.puntuales}
              </div>
              <div className="text-xs font-bold opacity-60 text-accent flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Puntuales
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl font-black text-accent">
                {stats.juegos}
              </div>
              <div className="text-xs font-bold opacity-60 text-accent">
                Juegos
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl font-black text-accent">
                {stats.social}
              </div>
              <div className="text-xs font-bold opacity-60 text-accent">
                Social
              </div>
            </div>
          </div>

          {filteredAsistentes.length === 0
            ? (
              <div className="text-center text-white/60 py-8">
                {act.asistentes.length === 0
                  ? "No hay asistentes registrados"
                  : "No hay asistentes que coincidan con los filtros"}
              </div>
            )
            : (
              <div className="space-y-3">
                {filteredAsistentes.filter((p) => p.sexo === "F").length > 0 && (
                  <div className="bg-accent/20 rounded-xl p-3 border border-accent/30">
                    <div className="font-bold text-sm text-accent mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      Mujeres (
                      {filteredAsistentes.filter((p) => p.sexo === "F").length})
                    </div>
                    <div className="flex flex-col gap-1">
                      {filteredAsistentes
                        .filter((p) => p.sexo === "F")
                        .map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPlayer(p)}
                            className="bg-white rounded-lg p-2 flex flex-col gap-2 cursor-pointer hover:bg-accent/30 transition-colors sm:flex-row sm:items-center"
                          >
                            <Avatar p={p} size={28} />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm">
                                {p.nombre} {p.apellido}
                              </div>
                              <div className="text-xs text-accent/70">
                                {p.edad} años · {playerPts[p.id] || 0} pts
                              </div>
                            </div>
                            <span
                              className={
                                act.puntuales.includes(p.id)
                                  ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                                  : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700"
                              }
                            >
                              {act.puntuales.includes(p.id)
                                ? "Llegó temprano"
                                : "No llegó temprano"}
                            </span>
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 shrink-0 whitespace-nowrap">
                              {act.socials.includes(p.id) ? "Social" : "Juegos"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {filteredAsistentes.filter((p) => p.sexo === "M").length > 0 && (
                  <div className="bg-white/20 rounded-xl p-3 border border-white/30">
                    <div className="font-bold text-sm text-white mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      Varones (
                      {filteredAsistentes.filter((p) => p.sexo === "M").length})
                    </div>
                    <div className="flex flex-col gap-1">
                      {filteredAsistentes
                        .filter((p) => p.sexo === "M")
                        .map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPlayer(p)}
                            className="bg-white/90 rounded-lg p-2 flex flex-col gap-2 cursor-pointer hover:bg-white transition-colors sm:flex-row sm:items-center"
                          >
                            <Avatar p={p} size={28} />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-dark">
                                {p.nombre} {p.apellido}
                              </div>
                              <div className="text-xs text-dark/60">
                                {p.edad} años · {playerPts[p.id] || 0} pts
                              </div>
                            </div>
                            <span
                              className={
                                act.puntuales.includes(p.id)
                                  ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                                  : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700"
                              }
                            >
                              {act.puntuales.includes(p.id)
                                ? "Llegó temprano"
                                : "No llegó temprano"}
                            </span>
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 shrink-0 whitespace-nowrap">
                              {act.socials.includes(p.id) ? "Social" : "Juegos"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {selectedPlayer && (
            <PlayerPointsModal
              player={selectedPlayer}
              act={act}
              participants={db.participants}
              onClose={() => setSelectedPlayer(null)}
            />
          )}
        </>
      )}

      {editing && (
        <>
          {showNewPlayer && (
            <NewPlayerModal onClose={() => setShowNewPlayer(false)} />
          )}

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Asistencia</h3>
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

          <div className="grid grid-cols-1 gap-2 items-start sm:grid-cols-[repeat(auto-fill,minmax(310px,1fr))]">
            {sortedAll.map((p) => {
              const here = act.asistentes.includes(p.id);
              const punct = (act.puntuales || []).includes(p.id);
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border bg-white ${here ? "border-primary shadow-md shadow-primary/20" : "border-surface-dark"}`}
                >
                  <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                    <div className="flex gap-0 shrink-0 self-start sm:self-auto">
                      <button
                        onClick={() => toggleAttendance(p.id)}
                        disabled={locked}
                        className={cn(
                          "flex items-center justify-center h-9 min-w-9 px-2 text-sm font-semibold transition-colors rounded-l-2xl border",
                          locked &&
                            "opacity-50 cursor-not-allowed pointer-events-none",
                          here
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-surface-light text-text-muted border-surface-dark",
                          here ? "" : "border-r-0",
                        )}
                      >
                        {here
                          ? <CalendarCheck className="w-3.5 h-3.5" />
                          : <CalendarX className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => togglePunctual(p.id)}
                        disabled={locked}
                        className={cn(
                          "flex items-center justify-center h-9 min-w-9 px-2 text-sm font-semibold transition-colors rounded-r-2xl border border-l-0",
                          locked &&
                            "opacity-50 cursor-not-allowed pointer-events-none",
                          punct
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-surface-light text-text-muted border-surface-dark",
                        )}
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Avatar p={p} size={30} />
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "font-bold text-sm",
                          here ? "text-foreground" : "text-text-muted",
                        )}
                      >
                        {p.nombre} {p.apellido}
                      </div>
                      <div className="text-xs text-text-muted">
                        {getEdad(p.fechaNacimiento)}a
                      </div>
                    </div>
                    {here && (
                      <div className="flex flex-wrap gap-1 items-center">
                        <button
                          onClick={() => toggleSocial(p.id)}
                          disabled={locked}
                          className={cn(
                            "flex items-center gap-1 h-9 min-w-9 px-3 text-sm font-semibold transition-colors rounded-2xl border",
                            locked &&
                              "opacity-50 cursor-not-allowed pointer-events-none",
                            (act.socials || []).includes(p.id)
                              ? "bg-[#F59E0B33] border-[#F59E0B66] text-[#F59E0B]"
                              : "bg-primary/20 border-primary/40 text-primary",
                          )}
                        >
                          {(act.socials || []).includes(p.id)
                            ? <Coffee className="w-3.5 h-3.5" />
                            : <Zap className="w-3.5 h-3.5" />}
                          <span className="text-xs font-medium">
                            {(act.socials || []).includes(p.id)
                              ? "Social"
                              : "Juegos"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
