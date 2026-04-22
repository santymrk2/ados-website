"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { X, Download, Camera, User, ChevronLeft } from "lucide-react";
import { newPart, getEdad } from "@/lib/constants";
import { Label } from "@/components/ui/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { downloadBase64Image } from "@/lib/image-utils";
import { DatePicker } from "@/components/ui/calendar";
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
import { getParticipant } from "@/lib/api-client";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface ParticipantFormProps {
  db: any;
  initial?: any;
  onClose: () => void;
  onSave: (data: any, isNew: boolean) => Promise<void>;
}

export function ParticipantForm({ db, initial, onClose, onSave }: ParticipantFormProps) {
  const [form, setForm] = useState({ ...newPart(), ...initial });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
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

  const F = (k: string, v: any) => {
    setForm((f) => ({ ...f, [k]: v }));
    setHasChanges(true);
  };

  const handlePhoto = (file: File) => {
    if (!file) return;
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error("El archivo debe ser una imagen (JPEG, PNG, WebP o GIF)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImage((e.target?.result as string) || null);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (cropped: { thumb: string; altaCalidad: string }) => {
    F("foto", cropped.thumb);
    F("fotoAltaCalidad", cropped.altaCalidad);
    setTempImage(null);
  };

  const validateAndSave = async () => {
    if (!form.nombre.trim()) return toast.error("Ingresá el nombre");
    if (!form.fechaNacimiento) return toast.error("Ingresá la fecha de nacimiento");

    const age = getEdad(form.fechaNacimiento);
    if (age === null || age < 0 || age > 100) return toast.error("La fecha de nacimiento no es válida");

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
    const loadingToast = toast.loading("Guardando...");

    try {
      const isNew = !form.id;
      const p = isNew ? { ...form, id: db.nextPid } : form;
      await onSave(p, isNew);
      toast.dismiss(loadingToast);
      toast.success("Guardado con éxito");
      setHasChanges(false);
      onClose();
    } catch (e: any) {
      toast.dismiss(loadingToast);
      toast.error("Error al guardar: " + e.message);
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    const img = form.fotoAltaCalidad || form.foto;
    if (img) {
      downloadBase64Image(img, `perfil-${form.nombre || "jugador"}.jpg`);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="bg-primary pt-safe sticky top-0 z-10 shadow-lg">
        <div className="text-white p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-white/20 text-white hover:bg-white/30 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="font-black text-lg">
                {initial ? "Editar Perfil" : "Nuevo Jugador"}
              </div>
            </div>
            <Button
              onClick={validateAndSave}
              disabled={isSubmitting}
              className="bg-white text-primary font-black px-6 hover:bg-white/90"
            >
              Listo
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {/* Foto Section */}
        <div className="bg-white rounded-3xl p-6 border border-surface-dark flex flex-col items-center shadow-sm">
          <div 
            onClick={() => !isSubmitting && fileRef.current?.click()}
            className="relative group cursor-pointer"
          >
            <div className="w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center shadow-inner">
              {form.foto ? (
                <img src={form.foto} className="w-full h-full object-cover" alt="" />
              ) : (
                <User className="w-16 h-16 text-slate-300" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-4 border-white group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={isSubmitting}
              className="rounded-full px-4"
            >
              Cambiar Foto
            </Button>
            {form.foto && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isSubmitting}
                  className="rounded-full px-4"
                >
                  <Download className="w-4 h-4 mr-2" /> Descargar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    F("foto", "");
                    F("fotoAltaCalidad", "");
                  }}
                  disabled={isSubmitting}
                  className="rounded-full px-4"
                >
                  <X className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0] as File)}
          />
        </div>

        {/* Datos Personales */}
        <div className="bg-white rounded-3xl p-6 border border-surface-dark shadow-sm space-y-5">
          <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">Datos Personales</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold ml-1">Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => F("nombre", e.target.value)}
                placeholder="Ej. Juan"
                className="rounded-xl border-slate-200 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold ml-1">Apellido</Label>
              <Input
                value={form.apellido}
                onChange={(e) => F("apellido", e.target.value)}
                placeholder="Ej. Pérez"
                className="rounded-xl border-slate-200 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-600 font-bold ml-1">Apodo (opcional)</Label>
            <Input
              value={form.apodo}
              onChange={(e) => F("apodo", e.target.value)}
              placeholder="Ej. El Rayo"
              className="rounded-xl border-slate-200 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-600 font-bold ml-1">Fecha de Nacimiento</Label>
            <DatePicker
              value={form.fechaNacimiento}
              onChange={(date) => F("fechaNacimiento", date)}
              placeholder="Seleccionar fecha"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-600 font-bold ml-1">Sexo</Label>
            <div className="flex gap-3">
              <Button
                variant={form.sexo === "M" ? "default" : "outline"}
                onClick={() => F("sexo", "M")}
                className={cn(
                  "flex-1 rounded-xl font-bold h-12 transition-all",
                  form.sexo === "M" ? "bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-200" : "text-slate-500"
                )}
              >
                Varón
              </Button>
              <Button
                variant={form.sexo === "F" ? "default" : "outline"}
                onClick={() => F("sexo", "F")}
                className={cn(
                  "flex-1 rounded-xl font-bold h-12 transition-all",
                  form.sexo === "F" ? "bg-pink-500 hover:bg-pink-600 shadow-md shadow-pink-200" : "text-slate-500"
                )}
              >
                Mujer
              </Button>
            </div>
          </div>
        </div>

        <div className="h-20" /> {/* Espaciado final */}
      </div>

      {tempImage && (
        <ImageCropModal
          image={tempImage}
          onClose={() => setTempImage(null)}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Alerta Edad */}
      <AlertDialog open={showAgeAlert} onOpenChange={setShowAgeAlert}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-xl">¿Confirmar edad?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 font-medium">
              El jugador tiene <span className="font-bold text-primary">{pendingAge} años</span>. 
              Normalmente los participantes tienen entre 12 y 18 años.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => { setShowAgeAlert(false); setIsSubmitting(false); }} className="rounded-xl font-bold">
              Corregir
            </AlertDialogCancel>
            <AlertDialogAction onClick={performSave} className="rounded-xl font-bold bg-primary text-white">
              Guardar Igual
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
