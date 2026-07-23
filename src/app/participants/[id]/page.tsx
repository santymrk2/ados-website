"use client";

import { useMemo, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import {
  ChevronLeft,
  Award,
  Trophy,
  Target,
  Clock,
  Phone,
  Zap,
  Shield,
  Flame,
} from "lucide-react";
import { TEAM_COLORS, getEdad } from "@/lib/constants";
import { actPts } from "@/lib/calc";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, cn, getImg } from "@/lib/utils";
import { imagesEnabled } from "@/lib/images-config";
import { ImageExpandModal } from "@/components/ui/ImageExpandModal";
import { getParticipant } from "@/lib/api-client";


export const dynamic = "force-dynamic";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { db, isLoading: dbLoading } = useApp();

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const initialParticipant = useMemo(() => {
    if (!id || !db?.participants?.length) return null;
    return db.participants.find((p) => p.id === Number(id)) || null;
  }, [id, db?.participants]);

  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [player, setPlayer] = useState(initialParticipant);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

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

  const attributeConfigs = useMemo(
    () => [
      {
        label: "Activo",
        icon: Zap,
        threshold: (s: typeof stats) => s.acts >= 5,
        activeBg: "bg-emerald-50",
        activeText: "text-emerald-700",
        activeBorder: "border-emerald-200",
      },
      {
        label: "Goleador",
        icon: Target,
        threshold: (s: typeof stats) => s.gf >= 10,
        activeBg: "bg-blue-50",
        activeText: "text-blue-700",
        activeBorder: "border-blue-200",
      },
      {
        label: "Fiel",
        icon: Shield,
        threshold: (s: typeof stats) => s.acts >= 10,
        activeBg: "bg-purple-50",
        activeText: "text-purple-700",
        activeBorder: "border-purple-200",
      },
      {
        label: "Imparable",
        icon: Flame,
        threshold: (s: typeof stats) => s.total >= 100,
        activeBg: "bg-orange-50",
        activeText: "text-orange-700",
        activeBorder: "border-orange-200",
      },
      {
        label: "Veterano",
        icon: Award,
        threshold: (s: typeof stats) => s.acts >= 20,
        activeBg: "bg-amber-50",
        activeText: "text-amber-700",
        activeBorder: "border-amber-200",
      },
    ],
    []
  );



  if (dbLoading || !db) {
    return (
      <div className="min-h-screen bg-primary">
        <div className="px-4 pt-8 space-y-4">
          <div className="flex items-center gap-5">
            <Skeleton className="w-20 h-20 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-40 bg-white/10" />
              <Skeleton className="h-5 w-24 bg-white/10" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <Skeleton className="h-28 rounded-3xl bg-white/10" />
            <Skeleton className="h-28 rounded-3xl bg-white/10" />
            <Skeleton className="h-28 rounded-3xl bg-white/10" />
          </div>
          <Skeleton className="h-48 rounded-3xl bg-white/10" />
        </div>
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
    if (!imagesEnabled) return;
    const imageToShow = player.fotoAltaCalidad || player.foto;
    if (imageToShow) setExpandedImage(getImg(imageToShow));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header & Hero */}
      <div className="bg-primary pt-safe shadow-2xl relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-5 mb-4">
            <div
              onClick={handlePhotoClick}
              className={cn(
                "relative",
                imagesEnabled && player.foto && "cursor-pointer hover:scale-105 transition-transform"
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
                    &ldquo;{player.apodo}&rdquo;
                  </span>
                )}
              </div>
              {player.telefono && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Phone className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-white/80 text-sm font-medium">
                    {player.telefono}
                  </span>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-20 space-y-4">
        {/* Stats Principales */}
        <div className="grid grid-cols-3 gap-3">
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
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="bg-amber-100 p-2 rounded-2xl mb-2">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 tabular-nums">
              {stats.gf}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
              GOLES FÚTBOL
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

        {/* Atributos */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Atributos</h4>
            <Award className="w-4 h-4 text-slate-300" />
          </div>
          <div className="flex flex-wrap gap-2">
            {attributeConfigs.map((attr) => {
              const Icon = attr.icon;
              const unlocked = attr.threshold(stats);
              return (
                <span
                  key={attr.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                    unlocked
                      ? `${attr.activeBg} ${attr.activeText} ${attr.activeBorder}`
                      : "bg-slate-50 text-slate-300 border-slate-100"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {attr.label}
                </span>
              );
            })}
          </div>
        </div>

      </div>

      {imagesEnabled && (
        <ImageExpandModal
          image={expandedImage}
          playerName={`${player.nombre} ${player.apellido}`}
          onClose={() => setExpandedImage(null)}
        />
      )}
    </div>
  );
}
