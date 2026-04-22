"use client";

import { useMemo, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { useStore } from "@nanostores/react";
import { $role } from "@/store/appStore";
import {
  ChevronLeft,
  Star,
  BookOpen,
  CheckCircle,
  Award,
  Trophy,
  Target,
  Clock,
} from "lucide-react";
import { TEAM_COLORS, getTeamBg, getEdad } from "@/lib/constants";
import { actPts } from "@/lib/calc";
import { Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";
import { ImageExpandModal } from "@/components/ui/ImageExpandModal";
import { getParticipant } from "@/lib/api-client";
import type { Activity } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { db, isLoading: dbLoading } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";
// ... (rest of the file stays same until the end)

  const initialParticipant = useMemo(() => {
    if (!id || !db?.participants?.length) return null;
    return db.participants.find((p) => p.id === Number(id)) || null;
  }, [id, db?.participants]);

  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [player, setPlayer] = useState(initialParticipant);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

  useEffect(() => {
    if (initialParticipant?.id) {
      setIsLoadingFull(true);
      getParticipant(initialParticipant.id)
        .then((fullData) => {
          setPlayer(fullData);
        })
        .finally(() => {
          setIsLoadingFull(false);
        });
    }
  }, [initialParticipant?.id]);

  const stats = useMemo(() => {
    if (!player) return { total: 0, gf: 0, gh: 0, gb: 0, acts: 0 };
    const r = (db?.rankings || []).find((x) => x.id === player.id);
    return r || { total: 0, gf: 0, gh: 0, gb: 0, acts: 0 };
  }, [player?.id, db?.rankings]);

  const playerActivities = useMemo(() => {
    if (!player || !db?.activities) return [];
    return db.activities
      .filter((a) => a.asistentes.includes(player.id))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [player?.id, db?.activities]);

  const goalsBySport = useMemo(() => {
    const result = { f: 0, h: 0, b: 0 };
    if (!player || !db?.activities) return result;
    db.activities.forEach((a) => {
      (a.goles || []).forEach((g) => {
        if (g.pid === player.id) {
          result[g.tipo as keyof typeof result] = (result[g.tipo as keyof typeof result] || 0) + g.cant;
        }
      });
    });
    return result;
  }, [player?.id, db?.activities]);

  const teamsPlayed = useMemo(() => {
    if (!player || !db?.activities) return [];
    return Array.from(
      new Set(
        db.activities.flatMap((a) =>
          a.asistentes.includes(player.id) && a.equipos?.[player.id]
            ? [a.equipos[player.id]]
            : [],
        ),
      ),
    );
  }, [player?.id, db?.activities]);

  if (dbLoading || !db) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-pulse text-white font-black">Cargando...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
          <ChevronLeft className="w-12 h-12 text-slate-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Jugador no encontrado</h2>
        <Button variant="link" onClick={() => router.push("/participants")} className="mt-2">
          Volver a la lista
        </Button>
      </div>
    );
  }

  const handlePhotoClick = () => {
    const imageToShow = player.fotoAltaCalidad || player.foto;
    if (imageToShow) setExpandedImage(getImg(imageToShow));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Header & Hero */}
      <div className="bg-primary pt-safe shadow-2xl relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/participants")}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1">
              <div className="font-black text-white/70 uppercase tracking-widest text-[10px]">Perfil de Jugador</div>
            </div>
            {isAdmin && (
              <Button 
                onClick={() => router.push(`/participants/${player.id}/edit`)} 
                variant="secondary" 
                size="sm"
                className="rounded-full px-5 font-black h-8"
              >
                Editar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-5 mb-4">
            <div
              onClick={handlePhotoClick}
              className={cn(
                "relative",
                player.foto ? "cursor-pointer hover:scale-105 transition-transform" : ""
              )}
            >
              <div className="border-4 border-white/20 rounded-full p-1">
                <Avatar p={player} size={80} className="w-20 h-20 shadow-xl" />
              </div>
              {isLoadingFull && (
                <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="font-black text-3xl text-white leading-tight">
                {player.nombre} {player.apellido}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-white/80 font-bold text-sm bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  {getEdad(player.fechaNacimiento)} años
                </span>
                {player.apodo && (
                  <span className="text-white/60 font-medium italic text-sm">
                    "{player.apodo}"
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {teamsPlayed.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase"
                    style={{
                      backgroundColor: TEAM_COLORS[t] + '30',
                      color: 'white',
                      border: `1px solid ${TEAM_COLORS[t]}50`
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-20 space-y-4">
        {/* Stats Principales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="bg-primary/10 p-2 rounded-2xl mb-2">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="text-3xl font-black text-slate-900 tabular-nums">
              {stats.total}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
              PUNTOS TOTALES
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="bg-cyan-100 p-2 rounded-2xl mb-2">
              <Award className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 tabular-nums">
              {stats.acts}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
              ASISTENCIAS
            </div>
          </div>
        </div>

        {/* Goles Breakdown */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Goles por deporte</h4>
            <Trophy className="w-4 h-4 text-slate-300" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="font-black text-2xl text-slate-900">{goalsBySport.f}</div>
              <div className="text-[10px] font-bold text-slate-400">Fútbol</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="font-black text-2xl text-slate-900">{goalsBySport.h}</div>
              <div className="text-[10px] font-bold text-slate-400">Handball</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="font-black text-2xl text-slate-900">{goalsBySport.b}</div>
              <div className="text-[10px] font-bold text-slate-400">Básquet</div>
            </div>
          </div>
        </div>

        {/* Historial de Actividades */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Historial Reciente</h4>
            <Clock className="w-4 h-4 text-slate-300" />
          </div>
          
          {playerActivities.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="text-slate-400 font-bold text-sm">Sin actividades registradas</div>
            </div>
          ) : (
            <div className="space-y-3">
              {playerActivities.slice(0, 10).map((a) => {
                const pts = actPts(player.id, a, db.participants);
                const team = a.equipos?.[player.id];
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl border border-slate-100"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 leading-none mb-1">
                        {formatDate(a.fecha)}
                      </span>
                      <span className="font-bold text-sm text-slate-800 line-clamp-1">
                        {a.titulo || "Actividad"}
                      </span>
                    </div>
                    <div className="flex-1" />
                    {team && (
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded bg-white shadow-sm"
                        style={{ color: TEAM_COLORS[team] }}
                      >
                        {team}
                      </span>
                    )}
                    <div className="font-black text-primary text-sm whitespace-nowrap bg-primary/10 px-3 py-1 rounded-full">
                      {pts} pts
                    </div>
                  </div>
                );
              })}
              {playerActivities.length > 10 && (
                <div className="text-center text-[10px] font-black text-slate-400 pt-2 uppercase tracking-widest">
                  +{playerActivities.length - 10} actividades más
                </div>
              )}
            </div>
          )}
        </div>

        {/* Badges / Achievements Placeholder */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">Atributos</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl", stats.acts > 5 ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-300")}>
                <Star className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-700">Fidelidad</span>
                <span className="text-[10px] font-medium text-slate-400">{stats.acts > 5 ? "Frecuente" : "Iniciado"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl", goalsBySport.f + goalsBySport.h + goalsBySport.b > 5 ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-300")}>
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-700">Goleador</span>
                <span className="text-[10px] font-medium text-slate-400">{goalsBySport.f + goalsBySport.h + goalsBySport.b > 5 ? "Efectivo" : "En progreso"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageExpandModal
        image={expandedImage}
        playerName={`${player.nombre} ${player.apellido}`}
        onClose={() => setExpandedImage(null)}
      />
    </div>
  );
}
