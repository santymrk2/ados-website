"use client";

import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { ParticipantForm } from "@/app/participants/components/ParticipantForm";

export const dynamic = "force-dynamic";

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
