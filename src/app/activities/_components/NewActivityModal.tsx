"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/Common";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { newAct } from "@/lib/constants";
import { useApp } from "@/hooks/useApp";
import type { Activity } from "@/lib/types";

interface NewActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewActivityModal({ open, onOpenChange }: NewActivityModalProps) {
  const router = useRouter();
  const { db, saveActivity } = useApp();
  
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState<string | undefined>(undefined);
  const [cantEquipos, setCantEquipos] = useState(4);
  const [locked, setLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!titulo.trim() || !fecha) return;
    
    setIsSubmitting(true);
    try {
      const newActivity: Activity = {
        ...newAct(),
        id: 0,
        titulo: titulo.trim(),
        fecha: fecha!,
        cantEquipos,
        locked,
        asistentes: [],
        puntuales: [],
        biblias: [],
        equipos: {},
        juegos: [],
        socials: [],
        invitaciones: [],
        extras: [],
      };
      
      const newId = await saveActivity(newActivity, true);
      
      // Reset form
      setTitulo("");
      setFecha(undefined);
      setCantEquipos(4);
      setLocked(false);
      onOpenChange(false);
      
      // Navigate to edit the new activity
      router.push(`/activities/${newId}/edit`);
    } catch (e) {
      console.error("Error creating activity:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitulo("");
    setFecha(undefined);
    setCantEquipos(4);
    setLocked(false);
    onOpenChange(false);
  };

  const canSubmit = titulo.trim() && fecha && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Actividad</DialogTitle>
          <DialogDescription>
            Completá los datos básicos para crear una nueva actividad.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div>
            <Label>Nombre de Actividad</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Actividad Mayo"
            />
          </div>

          <div>
            <Label>Fecha</Label>
            <DatePicker
              value={fecha}
              onChange={setFecha}
              placeholder="Seleccionar fecha"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-surface-dark shadow-sm">
            <Label>Equipos</Label>
            <RadioGroup
              value={String(cantEquipos)}
              onValueChange={(v) => setCantEquipos(Number(v))}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="4" id="eq-4" />
                <label htmlFor="eq-4" className="text-sm font-bold cursor-pointer">
                  4 Equipos
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="6" id="eq-6" />
                <label htmlFor="eq-6" className="text-sm font-bold cursor-pointer">
                  6 Equipos
                </label>
              </div>
            </RadioGroup>
            <div className="text-[10px] text-text-muted mt-2">
              {cantEquipos === 6
                ? "Se habilitarán E5 y E6 en todas las secciones."
                : "Configuración estándar de 4 equipos (E1 a E4)."}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch checked={locked} onCheckedChange={setLocked} />
              <Label style={{ margin: 0 }} className="text-sm">
                {locked ? "Bloqueada" : "Desbloqueada"}
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? "Creando..." : "Crear Actividad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}