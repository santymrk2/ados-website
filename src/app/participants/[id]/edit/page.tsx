"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { newPart, getEdad } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { Modal, Label, SegmentedButtons } from "@/components/ui/Common";
import { SexBadge } from "@/components/ui/Badges";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getParticipant } from "@/lib/api-client";
import { ChevronLeft, X, Download, Camera } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ParticipantFormEditWrapper id={id} />;
}

function ParticipantFormEditWrapper({ id }: { id: string }) {
  const router = useRouter();
  const { db, saveParticipant, isLoading: dbLoading } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  const participant = useMemo(() => {
    if (!id || !db?.participants?.length) return null;
    const numericId = Number(id);
    return db.participants.find((p) => p.id === numericId) || null;
  }, [id, db?.participants]);

  useEffect(() => {
    if (!isAdmin) {
      router.push(`/participants/${id}`);
    }
  }, [isAdmin, id, router]);

  if (dbLoading || !db || !db.participants) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (!participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Jugador no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <ParticipantFormContent
      db={db}
      initial={participant}
      onClose={() => router.back()}
      onSave={saveParticipant}
    />
  );
}

function ParticipantFormContent({
  db,
  initial,
  onClose,
  onSave,
}: {
  db: any;
  initial: any;
  onClose: () => void;
  onSave: any;
}) {
  const [form, setForm] = useState({ ...newPart(), ...initial });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [showAgeAlert, setShowAgeAlert] = useState(false);
  const [pendingAge, setPendingAge] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

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

  const handleDownload = () => {
    const img = form.fotoAltaCalidad || form.foto;
    downloadBase64Image(img, `perfil-${form.nombre || "jugador"}.jpg`);
  };

  const handleCropComplete = (cropped: any) => {
    F("foto", cropped.thumb);
    F("fotoAltaCalidad", cropped.altaCalidad);
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

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-y-auto">
      <div className="bg-primary pt-safe sticky top-0 z-10">
        <div className="text-white p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-white/20 text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="font-black text-lg">
                {initial ? "Editar" : "Nuevo"} Jugador
              </div>
            </div>
            <Button
              onClick={validateAndSave}
              disabled={isSubmitting}
              className="bg-white text-primary font-bold"
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-white rounded-xl p-4 border border-surface-dark flex flex-col items-center">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full bg-surface-dark flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={() => fileRef.current?.click()}
            >
              {tempImage || form.foto ? (
                <img
                  src={tempImage || form.foto}
                  alt="Foto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-text-muted" />
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhoto(file);
              }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              Cambiar foto
            </Button>
            {(form.foto || tempImage) && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                Descargar
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-dark">
          <Label>Datos personales</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => F("nombre", e.target.value)}
                placeholder="Nombre"
              />
            </div>
            <div>
              <Label>Apellido</Label>
              <Input
                value={form.apellido}
                onChange={(e) => F("apellido", e.target.value)}
                placeholder="Apellido"
              />
            </div>
          </div>
          <div className="mt-3">
            <Label>Apodo (opcional)</Label>
            <Input
              value={form.apodo}
              onChange={(e) => F("apodo", e.target.value)}
              placeholder="Apodo"
            />
          </div>
          <div className="mt-3">
            <Label>Fecha de nacimiento</Label>
            <DatePicker
              value={form.fechaNacimiento}
              onChange={(val) => F("fechaNacimiento", val)}
            />
          </div>
          <div className="mt-3">
            <Label>Sexo</Label>
            <div className="flex gap-2 mt-1">
              <Button
                variant={form.sexo === "M" ? "default" : "outline"}
                onClick={() => F("sexo", "M")}
                className={
                  form.sexo === "M" ? "bg-cyan-600 border-cyan-600" : ""
                }
              >
                Varón
              </Button>
              <Button
                variant={form.sexo === "F" ? "default" : "outline"}
                onClick={() => F("sexo", "F")}
                className={
                  form.sexo === "F" ? "bg-pink-500 border-pink-500" : ""
                }
              >
                Mujer
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-dark">
          <Label>Contacto</Label>
          <div className="mt-2">
            <Label>Teléfono</Label>
            <Input
              value={form.telefono}
              onChange={(e) => F("telefono", e.target.value)}
              placeholder="Teléfono"
            />
          </div>
          <div className="mt-3">
            <Label>Email</Label>
            <Input
              value={form.email}
              onChange={(e) => F("email", e.target.value)}
              placeholder="Email"
            />
          </div>
        </div>
      </div>

      {showAgeAlert && (
        <AlertDialog open={showAgeAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edad fuera de rango</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro que querés agregar a un jugador con {pendingAge}{" "}
                años? (El rango normal es 12-18 años)
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowAgeAlert(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={performSave}>
                Guardar igual
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
