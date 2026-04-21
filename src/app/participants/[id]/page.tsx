"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { useStore } from "@nanostores/react";
import { $role } from "@/store/appStore";
import {
  ChevronLeft,
  Star,
  X,
  Phone,
  Mail,
  Award,
  Trophy,
  Target,
} from "lucide-react";
import { TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { actPts } from "@/lib/calc";
import { Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getParticipant } from "@/lib/db-utils";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, isLoading: dbLoading } = useApp();
  const role = useStore($role);
  const router = useRouter();

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
          <Button variant="link" onClick={() => router.push("/participants")}>
            Volver a jugadores
          </Button>
        </div>
      </div>
    );
  }

  const { activities, participants, rankings } = db;

  const [expandedImage, setExpandedImage] = useState(null);
  const [player, setPlayer] = useState(participant);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

  useEffect(() => {
    if (participant?.id) {
      setIsLoadingFull(true);
      getParticipant(participant.id)
        .then((fullData) => {
          setPlayer(fullData);
        })
        .finally(() => {
          setIsLoadingFull(false);
        });
    }
  }, [participant?.id]);

  const stats = useMemo(() => {
    const r = (rankings || []).find((x) => x.id === player.id);
    return r || { total: 0, gf: 0, gh: 0, gb: 0, acts: 0 };
  }, [player.id, rankings]);

  const playerActivities = useMemo(
    () =>
      activities
        .filter((a) => a.asistentes.includes(player.id))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [player.id, activities],
  );

  const goalsBySport = useMemo(() => {
    const result = { f: 0, h: 0, b: 0 };
    activities.forEach((a) => {
      (a.goles || []).forEach((g) => {
        if (g.pid === player.id) {
          result[g.tipo] = (result[g.tipo] || 0) + g.cant;
        }
      });
    });
    return result;
  }, [player.id, activities]);

  const teamsPlayed = Array.from(
    new Set(
      activities.flatMap((a) =>
        a.asistentes.includes(player.id) && a.equipos?.[player.id]
          ? [a.equipos[player.id]]
          : [],
      ),
    ),
  );

  const handlePhotoClick = () => {
    const imageToShow = player.fotoAltaCalidad || player.foto;
    if (imageToShow) setExpandedImage(imageToShow);
  };

  const getAge = (fechaNacimiento: string | null | undefined) => {
    if (!fechaNacimiento) return null;
    const [year, month, day] = fechaNacimiento.split("-").map(Number);
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = getAge(player.fechaNacimiento);

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-primary pt-safe sticky top-0 z-10">
          <div className="text-white p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/participants")}
                className="bg-white/20 text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <div className="font-black text-lg">
                  {player.nombre} {player.apellido}
                </div>
                {player.apodo && (
                  <div className="text-xs opacity-70">"{player.apodo}"</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 border border-surface-dark flex flex-col items-center">
            <div className="cursor-pointer" onClick={handlePhotoClick}>
              {isLoadingFull ? (
                <div className="w-24 h-24 bg-surface-dark rounded-full animate-pulse" />
              ) : (
                <Avatar p={player} size={96} className="w-24 h-24" />
              )}
            </div>
            <div className="text-center mt-3">
              <div className="font-black text-xl">
                {player.nombre} {player.apellido}
              </div>
              {player.apodo && (
                <div className="text-sm font-medium text-text-muted">
                  "{player.apodo}"
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-sm text-text-muted">
                  {age !== null ? `${age} años` : "—"}
                </span>
                <span className="text-xs text-text-muted">·</span>
                <span className="text-sm font-bold text-primary">
                  {player.sexo === "M"
                    ? "Varón"
                    : player.sexo === "F"
                      ? "Mujer"
                      : "Otro"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-surface-dark">
            <div className="font-bold text-sm mb-3">ESTADÍSTICAS</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-dark rounded-lg p-3 text-center">
                <Target className="w-5 h-5 mx-auto text-primary" />
                <div className="font-black text-xl text-primary">
                  {stats.total}
                </div>
                <div className="text-xs font-bold text-text-muted">PUNTOS</div>
              </div>
              <div className="bg-surface-dark rounded-lg p-3 text-center">
                <Star className="w-5 h-5 mx-auto text-primary" />
                <div className="font-black text-xl text-primary">
                  {player.acts}
                </div>
                <div className="text-xs font-bold text-text-muted">
                  ACTIVIDADES
                </div>
              </div>
              <div className="bg-surface-dark rounded-lg p-3 text-center">
                <Trophy className="w-5 h-5 mx-auto text-cyan-500" />
                <div className="font-black text-xl text-cyan-500">
                  {stats.gf + stats.gh + stats.gb}
                </div>
                <div className="text-xs font-bold text-text-muted">GOLES</div>
              </div>
              <div className="bg-surface-dark rounded-lg p-3 text-center">
                <Award className="w-5 h-5 mx-auto text-primary" />
                <div className="font-black text-xl text-primary">
                  {playerActivities.length}
                </div>
                <div className="text-xs font-bold text-text-muted">
                  ASISTENCIAS
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-surface-dark">
            <div className="font-bold text-sm mb-3">GOLES POR DEPORTE</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-cyan-50 rounded-lg p-3">
                <div className="text-2xl font-black text-cyan-600">
                  {goalsBySport.f}
                </div>
                <div className="text-xs font-bold text-cyan-600">FÚTBOL</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-2xl font-black text-orange-600">
                  {goalsBySport.h}
                </div>
                <div className="text-xs font-bold text-orange-600">
                  HANDBALL
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-2xl font-black text-purple-600">
                  {goalsBySport.b}
                </div>
                <div className="text-xs font-bold text-purple-600">BÁSQUET</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-surface-dark">
            <div className="font-bold text-sm mb-3">EQUIPOS</div>
            {teamsPlayed.length === 0 ? (
              <Empty text="Sin equipos" />
            ) : (
              <div className="flex gap-2 flex-wrap">
                {teamsPlayed.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-bold px-2 py-1 rounded"
                    style={{
                      backgroundColor: getTeamBg(t),
                      color: TEAM_COLORS[t],
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {(player.telefono || player.email) && (
            <div className="bg-white rounded-xl p-4 border border-surface-dark">
              <div className="font-bold text-sm mb-3">CONTACTO</div>
              <div className="flex flex-col gap-2 text-sm">
                {player.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-text-muted" />
                    <span>{player.telefono}</span>
                  </div>
                )}
                {player.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-text-muted" />
                    <span>{player.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 border border-surface-dark">
            <div className="font-bold text-sm mb-3">ÚLTIMAS ACTIVIDADES</div>
            {playerActivities.length === 0 ? (
              <Empty text="Sin actividades" />
            ) : (
              <div className="flex flex-col gap-2">
                {playerActivities.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-2 bg-surface-dark rounded-lg"
                  >
                    <div>
                      <div className="font-bold text-sm">
                        {a.titulo || formatDate(a.fecha)}
                      </div>
                      <div className="text-xs text-text-muted">
                        {formatDate(a.fecha)}
                      </div>
                    </div>
                    <div className="font-black text-primary">
                      {actPts(player.id, a, participants)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {expandedImage && (
          <Dialog
            open={!!expandedImage}
            onOpenChange={() => setExpandedImage(null)}
          >
            <DialogContent className="max-w-2xl bg-transparent border-0 p-0">
              <DialogTitle className="sr-only">Foto</DialogTitle>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedImage(null)}
                  className="absolute top-2 right-2 bg-white/80 rounded-full z-10"
                >
                  <X className="w-5 h-5" />
                </Button>
                <img
                  src={expandedImage}
                  alt="Foto"
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
