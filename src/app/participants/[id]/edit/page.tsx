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

import { ParticipantForm } from "@/app/participants/components/ParticipantForm";

export default function Page({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
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
    if (!isAdmin && !dbLoading) {
      router.push(`/participants/${id}`);
    }
  }, [isAdmin, dbLoading, id, router]);

  if (dbLoading || !db) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-pulse text-white font-black">Cargando...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  if (!participant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 font-bold">Jugador no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <ParticipantForm
      db={db}
      initial={participant}
      onClose={() => router.back()}
      onSave={saveParticipant}
    />
  );
}
