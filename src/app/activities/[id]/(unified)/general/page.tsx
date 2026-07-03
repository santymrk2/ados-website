"use client";

import { useEffect, useRef, useState } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/Common";
import { cn } from "@/lib/utils";
import { FileText, Lock, Unlock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { confirmDialog } from "@/components/ui/confirm-dialog";

export default function GeneralPage() {
  const {
    activity,
    isAdmin,
    locked,
    performQuickUpdate,
  } = useUnifiedActivity();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(activity.titulo);
  const [draftDate, setDraftDate] = useState(activity.fecha);
  const [draftTeams, setDraftTeams] = useState(activity.cantEquipos);
  const lastSavedRef = useRef({
    titulo: activity.titulo,
    fecha: activity.fecha,
    cantEquipos: activity.cantEquipos,
  });

  const canEdit = isAdmin && !locked;

  useEffect(() => {
    if (editing) return;

    setDraftTitle(activity.titulo);
    setDraftDate(activity.fecha);
    setDraftTeams(activity.cantEquipos);
    lastSavedRef.current = {
      titulo: activity.titulo,
      fecha: activity.fecha,
      cantEquipos: activity.cantEquipos,
    };
  }, [activity.titulo, activity.fecha, activity.cantEquipos, editing]);

  const flushDrafts = async (showSuccessToast = false) => {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      toast.error("El título no puede estar vacío");
      throw new Error("El título no puede estar vacío");
    }

    const snapshot = lastSavedRef.current;
    const dirty =
      nextTitle !== snapshot.titulo ||
      draftDate !== snapshot.fecha ||
      draftTeams !== snapshot.cantEquipos;

    if (!dirty) return;

    try {
      await performQuickUpdate("config_bulk", {
        titulo: nextTitle,
        fecha: draftDate,
        cantEquipos: draftTeams,
      });
      lastSavedRef.current = {
        titulo: nextTitle,
        fecha: draftDate,
        cantEquipos: draftTeams,
      };
      if (draftTitle !== nextTitle) {
        setDraftTitle(nextTitle);
      }
      if (showSuccessToast) {
        toast.success("Guardado");
      }
    } catch (error) {
      toast.error("Error al guardar");
      throw error;
    }
  };

  const handleFinishEditing = async () => {
    try {
      await flushDrafts(true);
      setEditing(false);
    } catch {
      // keep edit mode open if save fails
    }
  };

  const handleLockToggle = async () => {
    const newLocked = !locked;
    if (newLocked && !(await confirmDialog("¿Bloquear actividad? No se podrá editar hasta desbloquear."))) return;
    if (!newLocked && !(await confirmDialog("¿Desbloquear actividad? Se habilitará la edición."))) return;

    try {
      await performQuickUpdate("config", { k: "locked", v: newLocked });
      toast.success(newLocked ? "Actividad bloqueada" : "Actividad desbloqueada");
    } catch {
      toast.error("Error al cambiar estado de bloqueo");
    }
  };

  const handleTeamCountChange = async (val: number) => {
    if (![2, 4, 6].includes(val)) return;
    if (val === draftTeams) return;

    if (val < lastSavedRef.current.cantEquipos) {
      const ok = await confirmDialog(
        `Reducir a ${val} equipos eliminará los equipos inactivos y sus datos. ¿Continuar?`,
        { confirmText: "Reducir", isDestructive: true },
      );
      if (!ok) {
        return;
      }
    }

    setDraftTeams(val);
  };

  const readOnly = !editing || !canEdit;

  useEffect(() => {
    if (!editing) return;

    const snapshot = lastSavedRef.current;
    const dirty =
      draftTitle.trim() !== snapshot.titulo ||
      draftDate !== snapshot.fecha ||
      draftTeams !== snapshot.cantEquipos;

    if (!dirty) return;

    const timeout = setTimeout(() => {
      flushDrafts().catch(() => {});
    }, 500);

    return () => clearTimeout(timeout);
  }, [editing, draftTitle, draftDate, draftTeams]);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-white" />
          <h2 className="font-bold text-lg text-white">General</h2>
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={editing ? handleFinishEditing : () => setEditing(true)}
            className="bg-white/20 text-white hover:bg-white/30"
          >
            {editing ? "Listo" : "Editar"}
          </Button>
        )}
      </div>

      {/* Card */}
      <div
        className={cn(
          "bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5",
          editing && "ring-2 ring-primary/30",
        )}
      >
        {/* Title */}
        <div className="space-y-2">
          <Label>Título</Label>
          {readOnly ? (
            <p className="font-bold text-lg text-slate-900">
              {activity.titulo || "—"}
            </p>
          ) : (
            <Input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Nombre de la actividad"
              className="rounded-xl border-slate-200"
            />
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Fecha</Label>
          {readOnly ? (
            <p className="font-bold text-slate-900">
              {activity.fecha || "—"}
            </p>
          ) : (
            <DatePicker
              value={draftDate ?? undefined}
              onChange={(d) => setDraftDate(d ?? "")}
              placeholder="Seleccionar fecha"
              mode="dropdown"
            />
          )}
        </div>

        {/* Team count */}
        <div className="space-y-2">
          <Label>Cantidad de equipos</Label>
          {readOnly ? (
            <p className="font-bold text-slate-900">{activity.cantEquipos} equipos</p>
          ) : (
            <div className="flex gap-2">
              {[2, 4, 6].map((n) => (
                <Button
                  key={n}
                  variant={draftTeams === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTeamCountChange(n)}
                  className={cn(
                    "flex-1",
                    draftTeams === n
                      ? "bg-primary"
                      : "border-slate-200 text-slate-600",
                  )}
                >
                  {n}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Lock toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {locked ? (
              <Lock className="w-5 h-5 text-amber-500" />
            ) : (
              <Unlock className="w-5 h-5 text-green-500" />
            )}
            <div>
              <p className="font-bold text-sm text-slate-700">
                {locked ? "Bloqueada" : "Desbloqueada"}
              </p>
              <p className="text-xs text-slate-400">
                {locked
                  ? "Solo lectura para todos"
                  : "Admins pueden editar"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Switch
              checked={!locked}
              onCheckedChange={handleLockToggle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
