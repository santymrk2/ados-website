"use client";

import { useMemo, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { ParticipantFormModal } from "@/components/participants/ParticipantForm";

interface ParticipantFormWrapperProps {
  mode?: "new" | "edit";
  id?: string;
}

export default function ParticipantFormWrapper({ mode = "new", id }: ParticipantFormWrapperProps) {
  const router = useRouter();
  const { db, saveParticipant, refresh, isLoading: dbLoading } = useApp();

  // Check role - redirect if viewer
  const role = useStore($role);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isAdmin && (mode === "edit" || mode === "new")) {
      router.push(`/participants/${id || ""}`);
    }
  }, [isAdmin, mode, id, router]);

  const participant = useMemo(() => {
    if (mode !== "edit" || !id) return null;
    if (!db?.participants?.length) return null;
    const numericId = Number(id);
    return db.participants.find((p) => p.id === numericId) || null;
  }, [mode, id, db?.participants]);

  if (dbLoading || !db || !db.participants) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && (mode === "edit" || mode === "new")) {
    return null;
  }

  if (mode === "edit" && !participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Jugador no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <ParticipantFormModal
      db={db}
      initial={participant}
      onClose={() => router.back()}
      onSave={saveParticipant}
    />
  );
}