"use client";

import { useState } from "react";
import { Label, SegmentedButtons } from "../../../ui/Common";
import { Input } from "../../../ui/input";
import { HelpInfo } from "../../../ui/HelpInfo";
import { DatePicker } from "../../../ui/calendar";
import { RadioGroup, RadioGroupItem } from "../../../ui/radio-group";
import { Switch } from "../../../ui/switch";
import { Lock, LockOpen } from "lucide-react";
import { toast } from "../../../../hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../ui/alert-dialog";

export function TabInfo({ act, A, Q, locked }) {
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);

  const handleLockToggle = (checked) => {
    if (checked) {
      // Locking — no confirmation needed
      if (act.id) {
        Q("config", { k: "locked", v: true }, "locked", true);
      } else {
        A("locked", true);
      }
      toast.success("Actividad bloqueada", {
        description: "Nadie puede editar hasta que la desbloquees",
      });
    } else {
      // Unlocking — requires confirmation
      setShowUnlockDialog(true);
    }
  };

  const confirmUnlock = () => {
    if (act.id) {
      Q("config", { k: "locked", v: false }, "locked", false);
    } else {
      A("locked", false);
    }
    setShowUnlockDialog(false);
    toast.success("Actividad desbloqueada", {
      description: "Ya se pueden hacer cambios en todas las secciones",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Lock Switch */}
      <div className="bg-white rounded-2xl p-4 border border-surface-dark shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {locked ? (
              <div className="bg-red-100 rounded-full p-2">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
            ) : (
              <div className="bg-green-100 rounded-full p-2">
                <LockOpen className="w-5 h-5 text-green-600" />
              </div>
            )}
            <div>
              <Label style={{ margin: 0 }} className="text-sm font-bold">
                {locked ? "Actividad bloqueada" : "Actividad desbloqueada"}
              </Label>
              <p className="text-[10px] text-text-muted mt-0.5">
                {locked
                  ? "No se puede editar. Desbloquear para realizar cambios."
                  : "Se pueden hacer cambios en todas las secciones."}
              </p>
            </div>
          </div>
          <Switch
            checked={locked}
            onCheckedChange={handleLockToggle}
          />
        </div>
      </div>

      {/* Unlock confirmation dialog */}
      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desbloquear actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              Al desbloquear la actividad, cualquier persona podrá editar toda la
              información incluyendo asistencia, equipos, juegos y más.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnlock}>
              Desbloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className={locked ? "opacity-50 pointer-events-none" : ""}>
        <div className="flex flex-col gap-4">
          <div>
            <Label>Nombre de Actividad</Label>
            <Input
              value={act.titulo}
              onChange={(e) => A("titulo", e.target.value)}
              placeholder="Ej: Actividad Mayo"
              disabled={locked}
            />
          </div>

          <div>
            <Label>Fecha</Label>
            <DatePicker
              value={act.fecha}
              onChange={(date) => A("fecha", date)}
              placeholder="Seleccionar fecha"
              disabled={locked}
            />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-surface-dark shadow-sm">
            <Label>Equipos</Label>
            <RadioGroup
              value={String(act.cantEquipos || 4)}
              onValueChange={(v) => {
                const val = Number(v);
                if (act.id)
                  Q("config", { k: "cantEquipos", v: val }, "cantEquipos", val);
                else A("cantEquipos", val);
              }}
              className="flex gap-4 mt-2"
              disabled={locked}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="4" id="eq-4" disabled={locked} />
                <label
                  htmlFor="eq-4"
                  className="text-sm font-bold cursor-pointer"
                >
                  4 Equipos
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="6" id="eq-6" disabled={locked} />
                <label
                  htmlFor="eq-6"
                  className="text-sm font-bold cursor-pointer"
                >
                  6 Equipos
                </label>
              </div>
            </RadioGroup>
            <div className="text-[10px] text-text-muted mt-2">
              {act.cantEquipos === 6
                ? "Se habilitarán E5 y E6 en todas las secciones."
                : "Configuración estándar de 4 equipos (E1 a E4)."}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label style={{ margin: 0 }}>Nota</Label>
            <HelpInfo
              title="Flujo de Carga"
              text="1. Marcá Asistencia. 2. Asigná Equipos. 3. Cargá Juegos y Deportes. Los puntos se calculan automáticamente."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
