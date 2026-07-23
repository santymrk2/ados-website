"use client";

import { useMemo, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { useStore } from "@nanostores/react";
import { $role } from "@/store/appStore";
import { Phone, Pencil, Trash2 } from "lucide-react";
import { TEAM_COLORS, getEdad } from "@/lib/constants";
import { actPts } from "@/lib/calc";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { formatDate, cn, getImg } from "@/lib/utils";
import { imagesEnabled } from "@/lib/images-config";
import { ImageExpandModal } from "@/components/ui/ImageExpandModal";
import { getParticipant } from "@/lib/api-client";
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

export const dynamic = "force-dynamic";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { db, isLoading: dbLoading, deleteParticipant } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const initialParticipant = useMemo(() => {
    if (!id || !db?.participants?.length) return null;
    return db.participants.find((p) => p.id === Number(id)) || null;
  }, [id, db?.participants]);

  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [player, setPlayer] = useState(initialParticipant);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const playerId = player?.id;

  useEffect(() => {
    if (initialParticipant?.id) {
      queueMicrotask(() => setIsLoadingFull(true));
      getParticipant(initialParticipant.id)
        .then((fullData) => {
          queueMicrotask(() => setPlayer(fullData));
        })
        .finally(() => {
          queueMicrotask(() => setIsLoadingFull(false));
        });
    }
  }, [initialParticipant?.id]);

  const stats = useMemo(() => {
    if (!playerId) return { total: 0, gf: 0, gh: 0, gb: 0, acts: 0 };
    const r = (db?.rankings || []).find((x) => x.id === playerId);
    return r || { total: 0, gf: 0, gh: 0, gb: 0, acts: 0 };
  }, [playerId, db?.rankings]);

  const playerActivities = useMemo(() => {
    if (!playerId || !db?.activities) return [];
    return db.activities
      .filter((a) => a.asistentes.includes(playerId))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [playerId, db]);

  if (dbLoading || !db) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-muted font-bold mb-2">Jugador no encontrado</p>
        <button
          onClick={() => router.push("/participants")}
          className="text-primary font-bold text-sm"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  const handlePhotoClick = () => {
    if (!imagesEnabled) return;
    const imageToShow = player.fotoAltaCalidad || player.foto;
    if (imageToShow) setExpandedImage(getImg(imageToShow));
  };

  const handleDelete = async () => {
    if (confirmName.trim() === "Confirmar" && player) {
      await deleteParticipant(player.id);
      setDeleteDialogOpen(false);
      router.push("/participants");
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Player Info */}
      <div className="flex items-center gap-4">
        <div
          onClick={handlePhotoClick}
          className={cn(
            "relative",
            imagesEnabled &&
              player.foto &&
              "cursor-pointer hover:scale-105 transition-transform",
          )}
        >
          <Avatar p={player} size={64} className="w-16 h-16" />
          {isLoadingFull && (
            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg truncate">
            {player.nombre} {player.apellido}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-text-muted text-sm">
              {getEdad(player.fechaNacimiento)} años
            </span>
            {player.apodo && (
              <>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted text-sm italic">
                  &ldquo;{player.apodo}&rdquo;
                </span>
              </>
            )}
          </div>
          {player.telefono && (
            <div className="flex items-center gap-1.5 mt-1">
              <Phone className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-muted text-sm">
                {player.telefono}
              </span>
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={() => router.push(`/participants/${player.id}/edit`)}
              variant="outline"
              size="icon"
              className="h-10 w-10"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => {
                setConfirmName("");
                setDeleteDialogOpen(true);
              }}
              variant="destructive"
              size="icon"
              className="h-10 w-10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-primary rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-accent">{stats.total}</div>
          <div className="text-[10px] font-bold opacity-60 text-accent">
            Puntos
          </div>
        </div>
        <div className="bg-primary rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-accent">{stats.acts}</div>
          <div className="text-[10px] font-bold opacity-60 text-accent">
            Asistencias
          </div>
        </div>
        <div className="bg-primary rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-accent">{stats.gf}</div>
          <div className="text-[10px] font-bold opacity-60 text-accent">
            Goles
          </div>
        </div>
      </div>

      {/* Activity History */}
      <div>
        <div className="font-bold text-base mb-3">Historial</div>
        {playerActivities.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">
            Sin actividades registradas
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {playerActivities.slice(0, 10).map((a) => {
              const pts = actPts(player.id, a, db.participants);
              const team = a.equipos?.[player.id];
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-surface-dark"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">
                      {a.titulo || "Actividad"}
                    </div>
                    <div className="text-xs text-text-muted">
                      {formatDate(a.fecha)}
                    </div>
                  </div>
                  {team && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ color: TEAM_COLORS[team] }}
                    >
                      {team}
                    </span>
                  )}
                  <div className="font-black text-primary text-sm">
                    {pts} pts
                  </div>
                </div>
              );
            })}
            {playerActivities.length > 10 && (
              <div className="text-center text-xs text-text-muted pt-2">
                +{playerActivities.length - 10} más
              </div>
            )}
          </div>
        )}
      </div>

      {imagesEnabled && (
        <ImageExpandModal
          image={expandedImage}
          playerName={`${player.nombre} ${player.apellido}`}
          onClose={() => setExpandedImage(null)}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar jugador?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que querés eliminar a{" "}
              <span className="font-semibold text-foreground">
                {player.nombre} {player.apellido}
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
              onClick={handleDelete}
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
