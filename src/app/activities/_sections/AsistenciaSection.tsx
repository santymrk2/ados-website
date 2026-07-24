"use client";

import { useState, useMemo, useEffect } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";
import { useApp } from "@/hooks/useApp";
import { toast } from "@/hooks/use-toast";
import { getEdad, newPart, TEAMS } from "@/lib/constants";
import { actPts } from "@/lib/calc";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/Common";
import { cn, normalizeText } from "@/lib/utils";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { PlayerPointsModal } from "@/app/activities/_components/PlayerPointsModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Clock,
  Coffee,
  Zap,
  CalendarCheck,
  CalendarX,
  Plus,
  Users,
  Search,
  ArrowDownAZ,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { DetailSheet } from "@/components/ui/DetailSheet";
import type { Activity, ParticipantBasic } from "@/lib/types";

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
  });
  const [invitadorId, setInvitadorId] = useState<number | null>(null);
  const [invitadorOpen, setInvitadorOpen] = useState(false);
  const [invitadorSearch, setInvitadorSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredInvitadores = useMemo(() => {
    if (!invitadorSearch.trim()) return db.participants;
    const q = normalizeText(invitadorSearch);
    return db.participants.filter((p) =>
      normalizeText(`${p.nombre} ${p.apellido}`).includes(q),
    );
  }, [db.participants, invitadorSearch]);

  const invitador = invitadorId
    ? db.participants.find((p) => p.id === invitadorId) || null
    : null;

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
      await saveParticipant(p, true, invitadorId);

      await performQuickUpdate("attendance", {
        participantId: p.id,
        value: true,
      });

      onClose();
    } catch {
      // Error already handled by performQuickUpdate or saveParticipant
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DetailSheet
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title="Nuevo Jugador"
    >
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
        <input
          type="date"
          value={form.fechaNacimiento}
          onChange={(e) => setForm((p) => ({ ...p, fechaNacimiento: e.target.value }))}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
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
              form.sexo === "M" ? "bg-primary" : "border-border",
            )}
          >
            Varón
          </Button>
          <Button
            variant={form.sexo === "F" ? "default" : "outline"}
            onClick={() => setForm((p) => ({ ...p, sexo: "F" }))}
            className={cn(
              "flex-1",
              form.sexo === "F" ? "bg-primary" : "border-border",
            )}
          >
            Mujer
          </Button>
        </div>
      </div>
      <div className="mb-4">
        <Label className="mb-1">Invitado por (opcional)</Label>
        <Popover open={invitadorOpen} onOpenChange={setInvitadorOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors",
                invitador
                  ? "border-border bg-white hover:bg-muted"
                  : "border-dashed border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {invitador ? (
                <>
                  <Avatar p={invitador} size={20} />
                  <span className="font-medium">{invitador.nombre} {invitador.apellido}</span>
                </>
              ) : (
                <span>Seleccionar invitador...</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-0">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={invitadorSearch}
                  onChange={(e) => setInvitadorSearch(e.target.value)}
                  className="h-8 pl-8 text-xs bg-white"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-44 overflow-auto py-1">
              {invitador && (
                <button
                  type="button"
                  onClick={() => { setInvitadorId(null); setInvitadorOpen(false); setInvitadorSearch(""); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Quitar invitador
                </button>
              )}
              {filteredInvitadores.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setInvitadorId(p.id); setInvitadorOpen(false); setInvitadorSearch(""); }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted transition-colors",
                    p.id === invitadorId && "bg-primary/10",
                  )}
                >
                  <Avatar p={p} size={20} />
                  <span className="text-sm truncate">{p.nombre} {p.apellido}</span>
                </button>
              ))}
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
    </DetailSheet>
  );
}

function GenderGroup({
  label,
  players,
  playerPts,
  act,
  setSelectedPlayer,
}: {
  label: string;
  players: (ParticipantBasic & { edad: number })[];
  playerPts: Record<number, number>;
  act: Activity;
  setSelectedPlayer: (p: ParticipantBasic) => void;
}) {
  return (
    <div className="bg-white/20 rounded-xl p-3 border border-white/30">
      <div className="font-bold text-sm text-white mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white" />
        {label} ({players.length})
      </div>
      <div className="flex flex-col gap-1">
        {players.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedPlayer(p)}
            className="bg-white/90 rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:bg-white transition-colors"
          >
            <Avatar p={p} size={28} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-foreground">
                {p.nombre} {p.apellido}
              </div>
              <div className="text-xs text-foreground/60">
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
              {act.puntuales.includes(p.id) ? "Puntual" : "Tardes"}
            </span>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 shrink-0 whitespace-nowrap">
              {act.socials.includes(p.id) ? "Social" : "Juegos"}
            </span>
          </div>
        ))}
      </div>
    </div>
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
    setFilterContent,
    setFiltersActive,
  } = useUnifiedActivity();
  const [editing, setEditing] = useState(false);
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<ParticipantBasic | null>(
    null,
  );
  const [genderFilter, setGenderFilter] = useState<"all" | "M" | "F">("all");
  const [sortMode, setSortMode] = useState<"name" | "lastname" | "age" | "punctual">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSortClick = (mode: typeof sortMode) => {
    if (sortMode === mode) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortMode(mode);
      setSortDirection("asc");
    }
  };

  const canEdit = isAdmin && !locked;
  const activeTeams = TEAMS.slice(0, act.cantEquipos || 0);

  // Provide filter content to FloatingNav
  useEffect(() => {
    const isFiltered = genderFilter !== "all" || sortMode !== "name";
    setFiltersActive(isFiltered);
    setFilterContent(
      <div className="space-y-4">
        {/* Género */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
            Género
          </span>
          <div className="space-y-1 mt-1.5">
            <button
              onClick={() => setGenderFilter("all")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                genderFilter === "all"
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-muted/80 text-foreground",
              )}
            >
              <Users className="w-4 h-4" />
              Todos
            </button>
            <button
              onClick={() => setGenderFilter("M")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                genderFilter === "M"
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-muted/80 text-foreground",
              )}
            >
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              Varones
            </button>
            <button
              onClick={() => setGenderFilter("F")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                genderFilter === "F"
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-muted/80 text-foreground",
              )}
            >
              <span className="w-3 h-3 rounded-full bg-pink-500" />
              Mujeres
            </button>
          </div>
        </div>

        {/* Orden */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
            Ordenar por
          </span>
          <div className="space-y-1 mt-1.5">
            {[
              { mode: "name" as const, icon: ArrowDownAZ, label: "Nombre" },
              { mode: "lastname" as const, icon: ArrowDownAZ, label: "Apellido" },
              { mode: "age" as const, icon: Calendar, label: "Edad" },
              { mode: "punctual" as const, icon: CheckCircle, label: "Puntualidad" },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => handleSortClick(mode)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                  sortMode === mode
                    ? "bg-primary text-white"
                    : "bg-muted hover:bg-muted/80 text-foreground",
                )}
              >
                <Icon className={cn("w-4 h-4", sortMode === mode && sortDirection === "desc" && "rotate-180")} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>,
    );
    return () => setFilterContent(null);
  }, [genderFilter, sortMode, sortDirection, setFilterContent, setFiltersActive]);

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
  }, [act, db.participants]);

  const filteredAsistentes = useMemo(() => {
    if (!act) return [];
    const query = normalizeText(searchQuery).trim();
    const enriched: (ParticipantBasic & { edad: number })[] = [];
    for (const pid of act.asistentes) {
      const p = db.participants.find((x) => x.id === pid);
      if (!p) continue;
      if (genderFilter !== "all" && p.sexo !== genderFilter) continue;
      const edad = getEdad(p.fechaNacimiento);
      if (edad === null) continue;
    if (query) {
      const name = normalizeText(`${p.nombre} ${p.apellido}`);
      if (!name.includes(query)) continue;
    }
      enriched.push({ ...p, edad });
    }
    const dir = sortDirection === "desc" ? -1 : 1;
    enriched.sort((a, b) => {
      switch (sortMode) {
        case "name":
          return dir * a.nombre.localeCompare(b.nombre);
        case "lastname":
          return dir * a.apellido.localeCompare(b.apellido);
        case "age":
          return dir * (a.edad - b.edad);
        case "punctual": {
          const aP = act.puntuales.includes(a.id) ? 0 : 1;
          const bP = act.puntuales.includes(b.id) ? 0 : 1;
          return dir * (aP - bP);
        }
        default:
          return 0;
      }
    });
    return enriched;
  }, [act, db.participants, searchQuery, genderFilter, sortMode, sortDirection]);

  const sortedAll = useMemo(() => {
    let arr = [...db.participants];
    if (searchQuery) {
      const q = normalizeText(searchQuery);
      arr = arr.filter((p) =>
        normalizeText(`${p.nombre} ${p.apellido}`).includes(q),
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
  }, [act, db.participants]);

  const toggleAttendance = async (id: number) => {
    const isPresent = act.asistentes.includes(id);

    try {
      await performQuickUpdate("attendance", {
        participantId: id,
        value: !isPresent,
      });

      if (!isPresent) {
        await performQuickUpdate("socials", {
          participantId: id,
          value: false,
        });
      }
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
      {showNewPlayer && (
        <NewPlayerModal onClose={() => setShowNewPlayer(false)} />
      )}

      {canEdit && !editing && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setEditing(true)}
            variant="ghost"
            size="sm"
            className="bg-white/20 text-white hover:bg-white/30"
          >
            Editar
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
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-white/60 flex-wrap mb-5">
        <span className="bg-white/10 px-2 py-0.5 rounded-full">{stats.total} presentes</span>
        <span className="bg-white/10 px-2 py-0.5 rounded-full">{stats.puntuales} puntuales</span>
        <span className="bg-white/10 px-2 py-0.5 rounded-full">{stats.juegos} juegos</span>
        <span className="bg-white/10 px-2 py-0.5 rounded-full">{stats.social} social</span>
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
              <GenderGroup
                label="Mujeres"
                players={filteredAsistentes.filter((p) => p.sexo === "F")}
                playerPts={playerPts}
                act={act}
                setSelectedPlayer={setSelectedPlayer}
              />
            )}
            {filteredAsistentes.filter((p) => p.sexo === "M").length > 0 && (
              <GenderGroup
                label="Varones"
                players={filteredAsistentes.filter((p) => p.sexo === "M")}
                playerPts={playerPts}
                act={act}
                setSelectedPlayer={setSelectedPlayer}
              />
            )}
            </div>
          )}

        </>
      )}

      {editing && (
        <>
          <div className="flex items-center justify-between mb-4 mt-6">
            <h3 className="font-bold text-lg text-white">Asistencia</h3>
            {canEdit && (
              <Button
                onClick={() => setShowNewPlayer(true)}
                variant="ghost"
                size="sm"
                disabled={locked}
                className="bg-white/20 text-white hover:bg-white/30 text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Nuevo Jugador
              </Button>
            )}
          </div>

      <div className="grid grid-cols-1 gap-2 items-start sm:grid-cols-[repeat(auto-fill,minmax(310px,1fr))]">
        {sortedAll.map((p) => {
          const here = act.asistentes.includes(p.id);
          const punct = (act.puntuales || []).includes(p.id);
          return (
            <div
              key={p.id}
              className={`rounded-2xl border bg-white ${here ? "border-primary shadow-md shadow-primary/20" : "border-border"}`}
            >
              <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <div className="flex gap-0 shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => toggleAttendance(p.id)}
                    disabled={locked || !isAdmin}
                    className={cn(
                      "flex items-center justify-center h-9 min-w-9 px-2 text-sm font-semibold transition-colors rounded-l-2xl border",
                      (locked || !isAdmin) &&
                        "opacity-50 cursor-not-allowed pointer-events-none",
                      here
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border",
                      here ? "" : "border-r-0",
                    )}
                  >
                    {here
                      ? <CalendarCheck className="w-3.5 h-3.5" />
                      : <CalendarX className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => togglePunctual(p.id)}
                    disabled={locked || !isAdmin}
                    className={cn(
                      "flex items-center justify-center h-9 min-w-9 px-2 text-sm font-semibold transition-colors rounded-r-2xl border border-l-0",
                      (locked || !isAdmin) &&
                        "opacity-50 cursor-not-allowed pointer-events-none",
                      punct
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border",
                    )}
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => setSelectedPlayer(p)}
                >
                  <Avatar p={p} size={30} />
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "font-bold text-sm",
                        here ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {p.nombre} {p.apellido}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getEdad(p.fechaNacimiento)}a
                    </div>
                  </div>
                </div>
                {here && (
                  <div className="flex flex-wrap gap-1 items-center">
                    <button
                      onClick={() => toggleSocial(p.id)}
                      disabled={locked || !isAdmin}
                      className={cn(
                        "flex items-center gap-1 h-9 min-w-9 px-3 text-sm font-semibold transition-colors rounded-2xl border",
                        (locked || !isAdmin) &&
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

      {selectedPlayer && (
        <PlayerPointsModal
          player={selectedPlayer}
          act={act}
          participants={db.participants}
          onClose={() => setSelectedPlayer(null)}
          canEdit={canEdit}
          locked={locked}
          fromEditMode={editing}
          performQuickUpdate={performQuickUpdate}
          activeTeams={activeTeams}
        />
      )}
    </div>
  );
}
