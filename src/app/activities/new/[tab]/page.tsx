"use client";

import { useMemo, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { newAct } from "@/lib/constants";
import { ActivityFormModal } from "@/components/activities/ActivityForm";

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  return <ActivityFormWrapper mode="new" initialTab={tab} />;
}

function ActivityFormWrapper({ mode = "new", initialTab = "info" }: { mode?: "new" | "edit", initialTab?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { db, saveActivity, quickUpdate, saveParticipant, isLoading: dbLoading } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isAdmin && mode === "new") {
      router.push("/activities");
    }
  }, [isAdmin, mode, router]);

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

  if (!isAdmin && mode === "new") {
    return null;
  }

  return (
    <ActivityFormModal
      db={db}
      initial={mode === "new" ? newAct() : null}
      onClose={() => {
        router.push("/activities");
      }}
      onSave={saveActivity}
      onQuickUpdate={quickUpdate}
      onSaveParticipant={saveParticipant}
      initialTab={urlTab}
    />
  );
}