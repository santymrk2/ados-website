"use client";

import { useEffect, useState, useRef } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { newPart, getEdad } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { Modal, Label } from "@/components/ui/Common";
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
import { ChevronLeft, X, Download, Camera } from "lucide-react";

export const dynamic = "force-dynamic";

import { ParticipantForm } from "@/app/participants/components/ParticipantForm";

export default function Page() {
  const router = useRouter();
  const { db, saveParticipant, isLoading: dbLoading } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isAdmin && !dbLoading) {
      router.push("/participants");
    }
  }, [isAdmin, dbLoading, router]);

  if (dbLoading || !db) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-pulse text-white font-black">Cargando...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <ParticipantForm
      db={db}
      initial={null}
      onClose={() => router.back()}
      onSave={saveParticipant}
    />
  );
}
