"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "../../hooks/use-toast";
import { X, Download, Camera, User } from "lucide-react";
import { newPart, getEdad } from "@/lib/constants";
import { Modal, Label, SegmentedButtons } from "../ui/Common";
import { SexBadge } from "../ui/Badges";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ImageCropModal } from "../ui/ImageCropModal";
import { downloadBase64Image } from "@/lib/imageUtils";
import { DatePicker } from "../ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogPortal,
  AlertDialogOverlay,
} from "../ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

import { getParticipant } from "@/lib/db-utils";

export function ParticipantFormModal({ db, initial, onClose, onSave }) {
  const [form, setForm] = useState({ ...newPart(), ...initial });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [showAgeAlert, setShowAgeAlert] = useState(false);
  const [pendingAge, setPendingAge] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Cargar datos completos (incluyendo foto HD) al editar
  useEffect(() => {
    if (initial?.id) {
      getParticipant(initial.id).then((fullData) => {
        setForm((f) => ({ ...f, ...fullData }));
      });
    }
  }, [initial?.id]);

  const F = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setHasChanges(true);
  };

  const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  const handlePhoto = (file) => {
    if (!file) return;

    // Validar tipo de archivo real
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error("El archivo debe ser una imagen (JPEG, PNG, WebP o GIF)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImage(e.target?.result as string || null);
    };
    reader.readAsDataURL(file);
  };

  const validateAndSave = async () => {
    if (!form.nombre.trim()) return toast.error("Ingresá el nombre");
    if (!form.fechaNacimiento)
      return toast.error("Ingresá la fecha de nacimiento");

    const age = getEdad(form.fechaNacimiento);
    if (age === null || age < 0 || age > 100)
      return toast.error("La fecha de nacimiento no es válida");

    if (age < 12 || age > 18) {
      setPendingAge(age);
      setShowAgeAlert(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const isNew = !form.id;
      const p = isNew ? { ...form, id: db.nextPid } : form;
      await onSave(p, isNew);
      toast.success("Subido con éxito");
      setHasChanges(false);
      onClose();
    } catch (e) {
      const err = e as Error;
      toast.error("Error al guardar: " + err.message);
      setIsSubmitting(false);
    }
  };

  // Manejar el callback del recorte - recibe ambas imágenes
  const handleCropComplete = (cropped) => {
    F("foto", cropped.thumb);
    F("fotoAltaCalidad", cropped.altaCalidad);
  };

  // Descargar siempre la imagen de alta calidad
  const handleDownload = () => {
    const imagenParaDescargar = form.fotoAltaCalidad || form.foto;
    downloadBase64Image(
      imagenParaDescargar,
      `perfil-${form.nombre || "jugador"}.jpg`,
    );
  };

  // Manejar cierre seguro del modal
  const handleSafeClose = async () => {
    if (isSubmitting) return; // No permitir cerrar mientras se guarda
    if (hasChanges && !isSubmitting) {
      setShowUnsavedAlert(true);
      return;
    }
    onClose();
  };

  const handleSaveAndClose = async () => {
    setShowUnsavedAlert(false);
    await validateAndSave();
  };

  const handleDiscardChanges = () => {
    setShowUnsavedAlert(false);
    setHasChanges(false);
    onClose();
  };

  const handleConfirmAge = () => {
    setShowAgeAlert(false);
    performSave();
  };

  const handleCancelAge = () => {
    setShowAgeAlert(false);
    setPendingAge(null);
    setIsSubmitting(false);
  };

  return (
    <>
      <Modal
        title={form.id ? "Editar Jugador" : "Nuevo Jugador"}
        onClose={handleSafeClose}
        isLoading={isSubmitting}
      >
        <div className="flex flex-col items-center mb-5">
          <div
            onClick={() => !isSubmitting && fileRef.current?.click()}
            className={`w-24 h-24 rounded-full bg-surface-dark border-4 border-gray-300 overflow-hidden flex items-center justify-center ${
              !isSubmitting ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            }`}
          >
            {form.foto ? (
              <img
                src={form.foto}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <User className="w-12 h-12 text-text-muted opacity-20" />
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={isSubmitting}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Camera className="w-4 h-4" /> Foto
            </Button>
            {form.foto && (
              <>
                <Button
                  onClick={handleDownload}
                  disabled={isSubmitting}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    F("foto", "");
                    F("fotoAltaCalidad", "");
                  }}
                  disabled={isSubmitting}
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0])}
            disabled={isSubmitting}
          />
        </div>

        <Label>Nombre</Label>
        <Input
          value={form.nombre}
          onChange={(e) => F("nombre", e.target.value)}
          placeholder="Nombre"
          className="mb-4"
          disabled={isSubmitting}
        />

        <Label>Apellido</Label>
        <Input
          value={form.apellido}
          onChange={(e) => F("apellido", e.target.value)}
          placeholder="Apellido"
          className="mb-4"
          disabled={isSubmitting}
        />

        <Label>Fecha de Nacimiento</Label>
        <DatePicker
          value={form.fechaNacimiento}
          onChange={(date) => F("fechaNacimiento", date)}
          placeholder="Seleccionar fecha"
          className="mb-4"
          disabled={isSubmitting}
        />

        <Label>Sexo</Label>
        <Tabs
          value={form.sexo}
          onValueChange={(v) => !isSubmitting && F("sexo", v)}
          className="mb-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="M" className="gap-2">
              <SexBadge sex="M" /> Varón
            </TabsTrigger>
            <TabsTrigger value="F" className="gap-2">
              <SexBadge sex="F" /> Mujer
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={validateAndSave}
          disabled={isSubmitting}
          className="w-full mt-4"
          size="lg"
        >
          {isSubmitting
            ? "Cargando..."
            : form.id
              ? "Guardar Cambios"
              : "Agregar Jugador"}
        </Button>

        {tempImage && !isSubmitting && (
          <ImageCropModal
            image={tempImage}
            onClose={() => setTempImage(null)}
            onCropComplete={handleCropComplete}
          />
        )}
      </Modal>

      {/* AlertDialog para cambios sin guardar */}
      <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Deseas guardar antes de salir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardChanges}>
              Descartar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndClose}>
              Guardar y salir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para confirmar edad fuera de rango */}
      <AlertDialog open={showAgeAlert} onOpenChange={setShowAgeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar edad</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que querés agregar a {form.nombre} con una edad de{" "}
              {pendingAge} años?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelAge}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAge}>
              Agregar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
