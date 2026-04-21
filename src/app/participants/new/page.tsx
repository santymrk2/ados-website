"use client";

import { useMemo, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { ParticipantFormModal } from "@/components/participants/ParticipantForm";

export const dynamic = 'force-dynamic';

export default function Page() {
  const router = useRouter();
  const { db, saveParticipant, isLoading: dbLoading } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      router.push("/participants");
    }
  }, [isAdmin, router]);

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

  return (
    <ParticipantFormModal
      db={db}
      initial={null}
      onClose={() => router.back()}
      onSave={saveParticipant}
    />
  );
}