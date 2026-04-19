"use client";

import { useState } from "react";
import { useApp } from "../../hooks/useApp";
import { getTodayDateString } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/Common";
import { DatePicker } from "../ui/calendar";

export function NewActivityModal({ onClose }) {
  const { saveActivity, db } = useApp();
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(getTodayDateString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const emptyActivity = {
      titulo: titulo.trim() || "Sin título",
      fecha,
      asistentes: [],
      equipos: {},
      juegos: [],
      puntuales: [],
      biblias: [],
      partidos: [],
      goles: [],
    };
    await saveActivity(emptyActivity, true);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Actividad</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: 3ero de Mayo, Actividad 15 de mayo, ..."
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="fecha">Fecha</Label>
            <DatePicker
              value={fecha}
              onChange={setFecha}
              placeholder="Seleccionar fecha"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="flex-1"
          >
            {saving ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
