"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { PlayerDetailModal } from "@/components/participants/PlayerDetail";
import { Button } from "@/components/ui/button";

interface PlayerDetailWrapperProps {
  id: string;
}

export default function PlayerDetailWrapper({ id }: PlayerDetailWrapperProps) {
  const router = useRouter();
  const { db, isLoading: dbLoading } = useApp();

  const participant = useMemo(() => {
    if (!id || !db?.participants?.length) return null;
    return db.participants.find((p) => p.id === Number(id)) || null;
  }, [id, db?.participants]);

  if (dbLoading || !db || !db.participants) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Jugador no encontrado</p>
          <Button
            variant="link"
            onClick={() => router.push("/participants")}
            className="mt-2"
          >
            Volver a jugadores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PlayerDetailModal
      player={participant}
      db={db}
      onEdit={() => router.push(`/participants/${id}/edit`)}
      onClose={() => router.back()}
    />
  );
}