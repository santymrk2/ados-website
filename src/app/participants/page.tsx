"use client";

import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/ui/AppHeader";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
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
import type { ParticipantBasic } from "@/lib/types";

interface ParticipantWithStats extends ParticipantBasic {
  total: number;
  gf: number;
  gh: number;
  gb: number;
  acts: number;
}

function PlayerCard({
  p,
  isAdmin,
  onEdit,
  onDelete,
}: {
  p: ParticipantWithStats;
  isAdmin: boolean;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="bg-white rounded-xl p-3 border border-surface-dark flex items-center gap-3">
      <Avatar p={p} size={40} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate">
          {p.nombre} {p.apellido}
        </div>
      </div>
      {isAdmin && (
        <div className="flex gap-1.5 flex-shrink-0">
          <Button
            onClick={onEdit}
            variant="outline"
            size="icon"
            className="text-primary h-8 w-8"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={onDelete}
            variant="destructive"
            size="icon"
            className="h-8 w-8"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function PlayersSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-10 w-full rounded-xl" />
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const { db, isLoading, deleteParticipant } = useApp();
  const { participants } = db;

  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jugadorAEliminar, setJugadorAEliminar] = useState<ParticipantBasic | null>(null);
  const [confirmName, setConfirmName] = useState("");

  const role = useStore($role);
  const isAdmin = role === "admin";

  const list = useMemo(() => {
    if (!search.trim()) {
      return [...(participants || [])].sort((a, b) =>
        `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`),
      );
    }
    const q = search.toLowerCase();
    return (participants || [])
      .filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().includes(q))
      .sort((a, b) =>
        `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`),
      );
  }, [participants, search]);

  const del = (id: number) => {
    const jugador = (participants || []).find((p) => p.id === id);
    if (!jugador) return;
    setJugadorAEliminar(jugador);
    setConfirmName("");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmName.trim() === "Confirmar" && jugadorAEliminar) {
      await deleteParticipant(jugadorAEliminar.id);
      setDeleteDialogOpen(false);
      setJugadorAEliminar(null);
      setConfirmName("");
    }
  };

  if (isLoading) {
    return (
      <>
        <AppHeader title="Jugadores" showSettings={false} onMenuClick={() => {}} />
        <PlayersSkeleton />
      </>
    );
  }

  return (
    <div>
      <AppHeader
        title="Jugadores"
        sub={`${(participants || []).length} registrados`}
      />

      <div className="p-4">
        {isAdmin && (
          <Button
            onClick={() => router.push("/participants/new")}
            className="w-full mb-3"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Agregar Jugador
          </Button>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="pl-10"
          />
        </div>

        {(participants || []).length === 0 ? (
          <div className="text-center py-8">
            <Empty text="No hay jugadores" />
            {isAdmin && (
              <Button
                onClick={() => router.push("/participants/new")}
                className="mt-4"
                size="lg"
              >
                Agregar primer jugador
              </Button>
            )}
          </div>
        ) : list.length === 0 ? (
          <Empty text="No se encontraron resultados" />
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/participants/${p.id}`)}
                className="cursor-pointer"
              >
                <PlayerCard
                  p={p as ParticipantWithStats}
                  isAdmin={isAdmin}
                  onEdit={(e) => {
                    e?.stopPropagation();
                    router.push(`/participants/${p.id}/edit`);
                  }}
                  onDelete={(e) => {
                    e?.stopPropagation();
                    del(p.id);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar jugador?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que querés eliminar a{" "}
              <span className="font-semibold text-foreground">
                {jugadorAEliminar
                  ? `${jugadorAEliminar.nombre} ${jugadorAEliminar.apellido}`
                  : ""}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Escribí Confirmar"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={confirmName.trim() !== "Confirmar"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
