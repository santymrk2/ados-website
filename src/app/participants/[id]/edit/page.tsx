"use client";

import { useMemo, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { ParticipantFormModal } from "@/components/participants/ParticipantForm";

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ParticipantFormWrapper id={id} />;
}

function ParticipantFormWrapper({ id }: { id: string }) {
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
    <ParticipantFormModal
      db={db}
      initial={participant}
      onClose={() => router.back()}
      onSave={saveParticipant}
    />
  );
}