"use client";

import { useMemo, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { ActivityFormModal } from "@/components/activities/ActivityForm";

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string; tab: string }> }) {
  const { id, tab } = await params;
  return <ActivityFormWrapper mode="edit" id={id} initialTab={tab} />;
}

function ActivityFormWrapper({ mode = "edit", id, initialTab = "info" }: { mode?: "new" | "edit", id?: string, initialTab?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { db, saveActivity, quickUpdate, saveParticipant, isLoading: dbLoading } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  const activity = useMemo(() => {
    if (mode !== "edit" || !id || !db?.activities?.length) return null;
    return db.activities.find((a) => a.id === Number(id)) || null;
  }, [mode, id, db?.activities]);

  useEffect(() => {
    if (!isAdmin && mode === "edit") {
      router.push(`/activities/${id}`);
    }
  }, [isAdmin, mode, id, router]);

  const urlTab = searchParams.get("tab") || initialTab;

  if (dbLoading || !db || !db.activities) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && mode === "edit") {
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
        if (mode === "edit" && id) {
          router.push(`/activities/${id}/view/info`);
        } else {
          router.push("/activities");
        }
      }}
      onSave={saveActivity}
      onQuickUpdate={quickUpdate}
      onSaveParticipant={saveParticipant}
      initialTab={urlTab}
    />
  );
}