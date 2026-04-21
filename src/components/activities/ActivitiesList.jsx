"use client";

import { useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Pencil,
  Trash2,
  Users,
  Gamepad2,
  Award,
  Trophy,
  Plus,
} from "lucide-react";
import { TEAMS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { PageHeader, Empty } from "../ui/Common";
import { Chip } from "../ui/Badges";
import { Button } from "../ui/button";
import { formatDate } from "@/lib/utils";
import { $role } from "@/store/appStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Input } from "../ui/input";

export function ActivitiesList({ db, onView, onNew, onEdit, onDelete }) {
  // Check role
  const role = useStore($role);
  const isAdmin = role === "admin";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actAEliminar, setActAEliminar] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  const sorted = useMemo(
    () => [...db.activities].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [db.activities],
  );

  const del = (id, e) => {
    e.stopPropagation();
    const activity = db.activities.find((a) => a.id === id);
    if (!activity) return;
    setActAEliminar(activity);
    setConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (confirmText.trim() === "Confirmar") {
      onDelete(actAEliminar.id);
      setDeleteDialogOpen(false);
      setActAEliminar(null);
      setConfirmText("");
    }
  };

  return (
    <div>
      <PageHeader
        title="Actividades"
        sub={`${db.activities.length} registradas`}
      />
      <div className="p-4">
        {isAdmin && (
          <Button onClick={onNew} className="w-full mb-4" size="lg">
            <Plus className="w-5 h-5" />
            Agregar Actividad
          </Button>
        )}
        {sorted.length === 0 ? (
          <Empty text="No hay actividades todavía" />
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((a) => (
              <div
                key={a.id}
                onClick={() => onView(a)}
                className="bg-surface rounded-2xl border border-surface-dark overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="p-4 flex justify-between">
                  <div>
                    <div className="font-black text-base">
                      {a.titulo || "Sin título"}
                    </div>
                    <div className="text-sm text-text-muted mt-1">
                      {formatDate(a.fecha)}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(a);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => del(a.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="p-3 flex gap-2 border-t border-surface-dark flex-wrap">
                  <Chip icon={Users} val={a.asistentes.length} label="asist." />
                  <Chip icon={Gamepad2} val={a.juegos.length} label="juegos" />
                  <Chip
                    icon={Trophy}
                    val={(a.goles || []).reduce((s, g) => s + g.cant, 0)}
                    label="goles"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que querés eliminar la actividad{" "}
              <span className="font-semibold text-foreground">
                "{actAEliminar?.titulo || "Sin título"}"
              </span>
              ? esta acción es irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Escribí Confirmar"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={confirmText.trim() !== "Confirmar"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
