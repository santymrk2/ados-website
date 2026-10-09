"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { useUnifiedActivity } from "@/lib/activity-context";
import { $activities } from "@/store/appStore";
import { useApp } from "@/hooks/useApp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/calendar";
import { GroupedList } from "@/components/ui/GroupedList";
import { Reveal, SegmentedControl } from "@/app/_components/home-ui";
import { cn, formatDate } from "@/lib/utils";
import { sectionTitleClass, toolbarButtonClass } from "@/app/activities/[id]/(unified)/_components/ui-classes";
import { Lock, Unlock, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { ActivityTeamsCard } from "../_components/ActivityTeamsCard";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** One data row: label and value side by side when reading, label above the control when editing. */
function FieldRow({
  label,
  value,
  editing,
  children,
}: {
  label: string;
  value: string;
  editing: boolean;
  children: ReactNode;
}) {
  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-4 px-4 py-4">
        <span className="shrink-0 text-base text-muted-foreground">{label}</span>
        <span className="text-right text-base font-bold leading-tight text-foreground">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-4 py-4">
      <span className="text-sm font-bold text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export default function GeneralPage() {
  const router = useRouter();
  const { deleteActivity } = useApp();
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const lastSavedRef = useRef({
    titulo: activity.titulo,
    fecha: activity.fecha,
    cantEquipos: activity.cantEquipos,
  });

  const canEdit = isAdmin && !locked;

  const startEditing = () => {
    setDraftTitle(activity.titulo);
    setDraftDate(activity.fecha);
    setDraftTeams(activity.cantEquipos);
    lastSavedRef.current = {
      titulo: activity.titulo,
      fecha: activity.fecha,
      cantEquipos: activity.cantEquipos,
    };
    setEditing(true);
  };

  const flushDrafts = useCallback(async (showSuccessToast = false) => {
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

    const next = { titulo: nextTitle, fecha: draftDate, cantEquipos: draftTeams };
    try {
      // Autosave and "Listo" may overlap: same-key saves are queued. prev = the
      // last saved values, read when this request is sent; the ref advances then
      // so a queued follow-up compares against these values.
      await performQuickUpdate("config_bulk", next, undefined, undefined, () => {
        const prev = { ...lastSavedRef.current };
        lastSavedRef.current = next;
        return { prev };
      });
      if (draftTitle !== nextTitle) {
        setDraftTitle(nextTitle);
      }
      if (showSuccessToast) {
        toast.success("Guardado");
      }
    } catch (error) {
      // Rebase on the server values (refetched on conflict) and keep the drafts:
      // the next save goes through, or surfaces a real conflict once more
      const fresh = $activities.get().find((a) => a.id === activity.id);
      if (fresh) {
        lastSavedRef.current = { titulo: fresh.titulo, fecha: fresh.fecha, cantEquipos: fresh.cantEquipos };
      }
      // No toast here: activity-context already reports conflicts/errors of performQuickUpdate
      throw error;
    }
  }, [activity.id, draftTitle, draftDate, draftTeams, performQuickUpdate]);

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
      await performQuickUpdate("config", { k: "locked", v: newLocked, prev: locked });
      toast.success(newLocked ? "Actividad bloqueada" : "Actividad desbloqueada");
    } catch {
      // activity-context already reports the error
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

  const handleDelete = async () => {
    if (confirmText.trim() !== "Confirmar") return;
    try {
      await deleteActivity(activity.id);
      router.push("/activities");
    } catch {
      toast.error("Error al eliminar la actividad");
    }
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
  }, [editing, draftTitle, draftDate, draftTeams, flushDrafts]);

  return (
    <MotionConfig reducedMotion="user">
    <div className="max-w-2xl space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className={sectionTitleClass}>General</h2>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={editing ? handleFinishEditing : startEditing}
            className={toolbarButtonClass}
          >
            {editing ? "Listo" : "Editar"}
          </Button>
        )}
      </div>

      {/* Activity data */}
      <Reveal index={0}>
        <div className={cn("rounded-3xl transition-shadow", editing && "ring-2 ring-primary/30")}>
          <GroupedList>
            <FieldRow label="Título" value={activity.titulo || "—"} editing={!readOnly}>
              <Input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Nombre de la actividad"
                className="rounded-xl"
              />
            </FieldRow>

            <FieldRow
              label="Fecha"
              value={activity.fecha ? formatDate(activity.fecha) : "—"}
              editing={!readOnly}
            >
              <DatePicker
                value={draftDate ?? undefined}
                onChange={(d) => setDraftDate(d ?? "")}
                placeholder="Seleccionar fecha"
                mode="dropdown"
              />
            </FieldRow>

            <FieldRow
              label="Cantidad de equipos"
              value={`${activity.cantEquipos} equipos`}
              editing={!readOnly}
            >
              <SegmentedControl
                id="team-count"
                className="mb-0"
                value={String(draftTeams) as "2" | "4" | "6"}
                onChange={(v) => handleTeamCountChange(Number(v))}
                options={[
                  { key: "2", label: "2" },
                  { key: "4", label: "4" },
                  { key: "6", label: "6" },
                ]}
              />
            </FieldRow>

            {/* Team names/colors for this activity */}
            <ActivityTeamsCard />
          </GroupedList>
        </div>
      </Reveal>

      {/* Lock */}
      <Reveal index={1}>
        <GroupedList>
          <div className="flex items-center gap-3 px-4 py-4">
            {locked ? (
              <Lock className="size-5 shrink-0 text-amber-500" />
            ) : (
              <Unlock className="size-5 shrink-0 text-green-500" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium text-foreground">
                {locked ? "Bloqueada" : "Desbloqueada"}
              </p>
              <p className="text-xs text-muted-foreground">
                {locked ? "Solo lectura para todos" : "Admins pueden editar"}
              </p>
            </div>
            {editing && isAdmin && (
              <Switch
                checked={!locked}
                onCheckedChange={handleLockToggle}
              />
            )}
          </div>
        </GroupedList>
      </Reveal>

      {/* Delete section — only in edit mode */}
      {editing && isAdmin && (
        <Reveal index={2}>
          <div className="space-y-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2">
              <Trash2 className="size-5 text-destructive" />
              <h3 className="text-base font-bold text-destructive">Zona de peligro</h3>
            </div>
            <p className="text-sm text-destructive/80">
              Una vez eliminada, la actividad no se puede recuperar.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmText("");
                setDeleteDialogOpen(true);
              }}
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar actividad
            </Button>
          </div>
        </Reveal>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que querés eliminar la actividad{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{activity.titulo || "Sin título"}&rdquo;
              </span>
              ? Esta acción es irreversible. Escribí <strong>Confirmar</strong> para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Escribí "Confirmar"'
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmText.trim() !== "Confirmar"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </MotionConfig>
  );
}
