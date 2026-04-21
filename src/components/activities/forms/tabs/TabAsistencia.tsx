"use client";

import { useState, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  ArrowUpDown,
  X,
  Plus,
  Clock,
  BookOpen,
  Coffee,
  Zap,
} from "lucide-react";
import {
  TEAMS,
  getEdad,
  TEAM_COLORS,
  getTeamBg,
  newPart,
} from "@/lib/constants";
import { Modal, Label, Empty, PillCheck } from "@/components/ui/Common";
import { SexBadge } from "@/components/ui/Badges";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { confirmDialog } from "@/lib/confirm";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "@/components/ui/combobox";

let tempIdCounter = 0;
const generateTempId = () => -1 - tempIdCounter++;

function NewPlayerModal({ act, db, onClose, onSave, A, Q }) {
  const [newPlayer, setNewPlayer] = useState<{
    nombre: string;
    apellido: string;
    sexo: string;
    fechaNacimiento: string;
    invitadorId: string | null;
  }>({
    nombre: "",
    apellido: "",
    sexo: "M",
    fechaNacimiento: "",
    invitadorId: null,
  });
  const [isSubmittingPlayer, setIsSubmittingPlayer] = useState(false);

  const availableInvitados = useMemo(() => {
    return db.participants
      .filter((p) => act.asistentes.includes(p.id))
      .sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
      );
  }, [db.participants, act.asistentes]);

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

      const newAsistentes = Array.from(new Set([...act.asistentes, playerId]));
      Q(
        "attendance",
        { participantId: playerId, value: true },
        "asistentes",
        newAsistentes,
      );

      if (newPlayer.invitadorId) {
        A("invitaciones", [
          ...(act.invitaciones || []),
          {
            id: generateTempId(),
            invitador: newPlayer.invitadorId,
            invitado_id: playerId,
          },
        ]);
      }

      onClose();
      toast.success("Jugador agregado y registrado");
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
        className="max-w-sm bg-surface rounded-3xl p-5 flex flex-col overflow-y-auto max-h-[90vh]"
      >
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
                  newPlayer.sexo === "M" ? "bg-cyan-600 border-cyan-600" : "border-surface-dark"
                )}
              >
                Varón
              </Button>
              <Button
                variant={newPlayer.sexo === "F" ? "default" : "outline"}
                onClick={() => setNewPlayer((p) => ({ ...p, sexo: "F" }))}
                className={cn(
                  "flex-1",
                  newPlayer.sexo === "F" ? "bg-pink-500 border-pink-500" : "border-surface-dark"
                )}
              >
                Mujer
              </Button>
            </div>
          </div>

<div className="mb-4">
            <Label className="mb-1">¿Quién lo invitó?</Label>
            <Combobox
              value={newPlayer.invitadorId || ""}
              onValueChange={(val) =>
                setNewPlayer((p) => ({ ...p, invitadorId: val }))
              }
              items={availableInvitados.map((p) => ({
                value: p.id.toString(),
                label: `${p.nombre} ${p.apellido}`,
              }))}
            >
              <ComboboxInput placeholder="Seleccionar invitador..." />
              <ComboboxContent>
                <ComboboxList>
                  {availableInvitados.map((p) => (
                    <ComboboxItem key={p.id.toString()} value={p.id.toString()}>
                      {p.nombre} {p.apellido}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
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

export function TabAsistencia({ act, A, Q, db, onSaveParticipant, locked = false, savingOps }: { act: any; A: any; Q: any; db: any; onSaveParticipant: any; locked?: boolean; savingOps?: Set<unknown> }) {
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);

  const toggle = (key, id) => {
    const c = act[key] || [];
    const isIncluded = c.includes(id);
    const newValue = isIncluded ? c.filter((x) => x !== id) : [...c, id];

    if (key === "asistentes") {
      Q("attendance", { participantId: id, value: !isIncluded }, key, newValue);
      if (isIncluded) {
        A(
          "socials",
          (act.socials || []).filter((x) => x !== id),
        );
        A(
          "puntuales",
          (act.puntuales || []).filter((x) => x !== id),
        );
        A(
          "biblias",
          (act.biblias || []).filter((x) => x !== id),
        );
        const newEq = { ...act.equipos };
        delete newEq[id];
        A("equipos", newEq);
      }
    } else if (key === "socials") {
      Q("socials", { participantId: id, value: !isIncluded }, key, newValue);
      if (!isIncluded) {
        const newEq = { ...act.equipos };
        delete newEq[id];
        A("equipos", newEq);
      }
    } else if (key === "puntuales") {
      Q("puntuales", { participantId: id, value: !isIncluded }, key, newValue);
    } else if (key === "biblias") {
      Q("biblias", { participantId: id, value: !isIncluded }, key, newValue);
    } else {
      A(key, newValue);
    }
  };

  const sorted = useMemo(() => {
    let arr = [...db.participants];
    if (search) {
      arr = arr.filter((p) =>
        `${p.nombre} ${p.apellido}`
          .toLowerCase()
          .includes(search.toLowerCase()),
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
  }, [db.participants, sortOrder, search]);

  return (
    <div>
      {showNewPlayer && (
        <NewPlayerModal
          act={act}
          db={db}
          onClose={() => setShowNewPlayer(false)}
          onSave={onSaveParticipant}
          A={A}
          Q={Q}
        />
      )}

      <div className="flex flex-col gap-2 mb-3">
        <div className="flex gap-2 mb-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            title="Ordenar A→Z"
            variant="outline"
            size="icon"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Label style={{ margin: 0 }}>Asistencia ({sorted.length})</Label>
          <div className="flex gap-2 ml-auto">
            <Button
              onClick={() => setShowNewPlayer(true)}
              variant="ghost"
              size="sm"
              disabled={locked}
              className="bg-primary/10 text-primary text-xs flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Nuevo
            </Button>
            <Button
              onClick={() => setConfirmClearOpen(true)}
              variant="ghost"
              size="sm"
              disabled={locked}
              className="bg-red-50 text-red-500 text-xs"
            >
              Limpiar
            </Button>
            <Button
              onClick={() => setConfirmAllOpen(true)}
              variant="ghost"
              size="sm"
              disabled={locked}
              className="bg-teal-50 text-teal-600 text-xs"
            >
              Todos
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {sorted.map((p) => {
          const here = act.asistentes.includes(p.id);
          const punct = (act.puntuales || []).includes(p.id);
          const bib = (act.biblias || []).includes(p.id);
          const team = act.equipos?.[p.id];
          return (
            <div
              key={p.id}
              className={`rounded-lg border bg-white ${here ? 'border-primary shadow-md shadow-primary/20' : 'border-surface-dark'}`}
            >
              <div className="flex items-center p-3 gap-3">
                <Checkbox
                  checked={here}
                  onCheckedChange={() => toggle("asistentes", p.id)}
                  disabled={locked}
                />
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
                    {team && (
                      <span
                        className="text-[10px] font-bold rounded px-2 py-0.5"
                        style={{
                          backgroundColor: getTeamBg(team),
                          color: TEAM_COLORS[team],
                        }}
                      >
                        {team}
                      </span>
                    )}
                    <PillCheck
                      icon={(act.socials || []).includes(p.id) ? Coffee : Zap}
                      label={
                        (act.socials || []).includes(p.id) ? "SOCIAL" : "RECRE"
                      }
                      active={true}
                      onClick={() => toggle("socials", p.id)}
                      disabled={locked}
                      color={
                        (act.socials || []).includes(p.id)
                          ? "#F59E0B"
                          : "#10B981"
                      }
                    />
                    <PillCheck
                      icon={Clock}
                      active={punct}
                      onClick={() => toggle("puntuales", p.id)}
                      disabled={locked}
                      color="#FFD93D"
                    />
                    <PillCheck
                      icon={BookOpen}
                      active={bib}
                      onClick={() => toggle("biblias", p.id)}
                      disabled={locked}
                      color="#4ECDC4"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AlertDialog para limpiar asistencia */}
      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpiar asistencia</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que querés quitar la asistencia de todos los jugadores?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                A("asistentes", []);
                toast.success("Asistencia limpiada");
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Limpiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para seleccionar todos */}
      <AlertDialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seleccionar todos</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que querés marcar a todos los {sorted.length} jugadores como presentes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                A(
                  "asistentes",
                  sorted.map((p) => p.id),
                );
                toast.success("Todos presentes");
              }}
            >
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
