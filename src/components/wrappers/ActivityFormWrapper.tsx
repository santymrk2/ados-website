"use client";

import { useMemo, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { ActivityFormModal } from "@/components/activities/ActivityForm";

interface ActivityFormWrapperProps {
  mode?: "new" | "edit";
  id?: string;
  initialTab?: string;
}

export default function ActivityFormWrapper({ mode = "new", id, initialTab = "info" }: ActivityFormWrapperProps) {
  const router = useRouter();
  const { db, saveActivity, quickUpdate, saveParticipant, refresh, isLoading: dbLoading } = useApp();

  // Check role - redirect if viewer
  const role = useStore($role);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isAdmin && (mode === "edit" || mode === "new")) {
      router.push(`/activities/${id || ""}`);
    }
  }, [isAdmin, mode, id, router]);

  const activity = useMemo(() => {
    if (mode !== "edit" || !id) return null;
    if (!db?.activities?.length) return null;
    return db.activities.find((a) => a.id === Number(id)) || null;
  }, [mode, id, db?.activities]);

  if (dbLoading || !db || !db.activities) {
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

  if (mode === "edit" && !activity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Actividad no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <ActivityFormModal
      db={db}
      initial={activity}
      onClose={() => {
        // Si es modo edit, ir al view; si es modo new, ir al listado
        if (mode === "edit" && id) {
          router.push(`/activities/${id}/view/info`);
        } else {
          router.push("/activities");
        }
      }}
      onSave={saveActivity}
      onQuickUpdate={quickUpdate}
      onSaveParticipant={saveParticipant}
      initialTab={initialTab}
    />
  );
}