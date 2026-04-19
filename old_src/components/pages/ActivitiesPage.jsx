import { useState, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { navigate } from 'astro:transitions/client';
import { Pencil, Trash2, Users, Gamepad2, Award, Trophy, Calendar, Plus, X } from 'lucide-react';

import { PageHeader, Empty } from '../ui/Common';
import { Avatar } from '../ui/Avatar';
import { Chip } from '../ui/Badges';
import { Button } from '../ui/button';
import { formatDate, isToday } from '../../lib/utils';
import { useApp } from '../../hooks/useApp';
import { NewActivityModal } from '../activities/NewActivityModal';
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
import { confirmDialog } from '../../lib/confirm';
import { $role } from '../../store/appStore';

export default function ActivitiesPage() {
  const { db, deleteActivity, saveActivity, refresh } = useApp();
  const { activities } = db;
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actAEliminar, setActAEliminar] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  // Get role from store
  const role = useStore($role);
  const isAdmin = role === 'admin';

  const sorted = useMemo(() => [...(activities || [])].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')), [activities]);

  const del = (id, e) => {
    e.stopPropagation();
    const act = activities.find(a => a.id === id);
    if (!act) return;
    setActAEliminar(act);
    setConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (confirmText.trim() === "Confirmar") {
      deleteActivity(actAEliminar.id);
      setDeleteDialogOpen(false);
      setActAEliminar(null);
      setConfirmText("");
    }
  };

  const delPartido = async (activityId, partidoId, e) => {
    e.stopPropagation();
    if (await confirmDialog('¿Eliminar este partido?')) {
      const activity = activities.find(a => a.id === activityId);
      if (activity) {
        const updated = {
          ...activity,
          partidos: (activity.partidos || []).filter(p => p.id !== partidoId),
        };
        await saveActivity(updated, false);
      }
    }
  };

  return (
    <div>
      <PageHeader title="Actividades" sub={`${(activities || []).length} registradas`} />
      <div className="p-4">
        {isAdmin && (
          <Button onClick={() => setShowNewModal(true)} className="w-full mb-4" size="lg">
            <Plus className="w-5 h-5" />
            Nueva Actividad
          </Button>
        )}
        {sorted.length === 0 ? (
          <Empty text="No hay actividades todavía" />
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((a) => {
              const isHoy = isToday(a.fecha);
              return (
                <div
                  key={a.id}
                  onClick={() => { navigate(`/activities/${a.id}`); }}
                  className={`bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${isHoy ? 'border-primary shadow-lg shadow-primary/20' : 'border-surface-dark'
                    }`}
                >
                  {isHoy && (
                    <div className="bg-primary text-white text-xs font-bold px-3 py-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> HOY
                    </div>
                  )}
                  <div className="p-4 flex justify-between">
                    <div>
                      <div className="font-black text-base">{a.titulo || 'Sin título'}</div>
                      <div className={`text-sm mt-1 flex items-center gap-2 ${isHoy ? 'text-primary font-bold' : 'text-text-muted'}`}>
                        {formatDate(a.fecha)}
                        {isHoy && <span className="bg-primary/20 px-2 py-0.5 rounded-full text-xs">HOY</span>}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/activities/${a.id}/edit`);
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
                    {(a.partidos || []).map((p) => (
                      <div key={p.id} className="flex items-center gap-1 bg-surface-dark/30 rounded-full px-2 py-1 text-xs font-medium">
                        <span>{p.equipo1} vs {p.equipo2}</span>
                        {isAdmin && (
                          <button
                            onClick={(e) => delPartido(a.id, p.id, e)}
                            className="ml-1 p-0.5 hover:bg-red-100 rounded-full text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Chip icon={Trophy} val={(a.goles || []).reduce((s, g) => s + g.cant, 0)} label="goles" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNewModal && <NewActivityModal onClose={() => setShowNewModal(false)} />}

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
