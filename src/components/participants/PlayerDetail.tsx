"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, Star, BookOpen, CheckCircle } from "lucide-react";
import { TEAM_COLORS, getTeamBg, getEdad } from "@/lib/constants";
import { actPts } from "@/lib/calc";
import { Empty } from "@/components/ui/Common";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ImageExpandModal } from "@/components/ui/ImageExpandModal";
import { getParticipant } from "@/lib/db-utils";

export function PlayerDetailModal({ player: initialPlayer, db, onEdit, onClose }) {
  const { activities, participants } = db;
  const [expandedImage, setExpandedImage] = useState(null);
  const [player, setPlayer] = useState(initialPlayer);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

  // Cargar datos completos (incluyendo foto HD) al abrir
  useEffect(() => {
    if (initialPlayer?.id) {
      setIsLoadingFull(true);
      getParticipant(initialPlayer.id)
        .then((fullData) => {
          setPlayer(fullData);
        })
        .finally(() => {
          setIsLoadingFull(false);
        });
    }
  }, [initialPlayer?.id]);

  const stats = useMemo(() => {
    const r = (db.rankings || []).find(x => x.id === player.id);
    return r || { total: 0, gf: 0, gh: 0, gb: 0, acts: 0 };
  }, [player.id, db.rankings]);

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

  const teamsPlayed: string[] = Array.from(new Set(
      (activities as any[]).flatMap((a) =>
        a.asistentes.includes(player.id) && a.equipos?.[player.id]
          ? [a.equipos[player.id] as string]
          : [],
      ),
    ));

  const handlePhotoClick = () => {
    const imageToShow = player.fotoAltaCalidad || player.foto;
    if (imageToShow) {
      setExpandedImage(imageToShow);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-primary z-50 overflow-y-auto">
        <div className="pt-safe">
          <div className="bg-primary text-white p-4">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="font-black text-lg">Perfil del Jugador</div>
            </div>
            <Button onClick={onEdit} variant="secondary" size="sm">
              Editar
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div
              onClick={handlePhotoClick}
              className={
                player.foto
                  ? "cursor-pointer hover:opacity-80 transition-opacity"
                  : ""
              }
            >
              <Avatar p={player} size={72} />
            </div>
            <div>
              <div className="font-black text-2xl">
                {player.nombre} {player.apellido}
              </div>
              <div className="flex gap-3 mt-1 text-sm opacity-80">
                <span>· {getEdad(player.fechaNacimiento)} años</span>
                {player.fechaNacimiento && (
                  <span>
                    · {(() => {
                      const [y, m, d] = player.fechaNacimiento.split("-").map(Number);
                      return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
                    })()}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
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
              {player.foto && (
                <div className="text-xs text-gray-300 mt-2">
                  Toca la foto para expandir
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl p-4 border border-surface-dark text-center">
              <div className="text-3xl font-black text-primary">
                {stats.total}
              </div>
              <div className="text-xs text-text-muted font-bold">
                PUNTOS TOTALES
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-dark text-center">
              <div className="text-3xl font-black text-primary">
                {stats.acts}
              </div>
              <div className="text-xs text-text-muted font-bold">
                ASISTENCIAS
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-surface-dark mb-4">
            <div className="font-bold text-sm mb-3">GOLES POR DEPORTE</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-surface-dark rounded-lg">
                <div className="font-black text-xl">{goalsBySport.f}</div>
                <div className="text-xs text-text-muted">Fútbol</div>
              </div>
              <div className="text-center p-2 bg-surface-dark rounded-lg">
                <div className="font-black text-xl">{goalsBySport.h}</div>
                <div className="text-xs text-text-muted">Handball</div>
              </div>
              <div className="text-center p-2 bg-surface-dark rounded-lg">
                <div className="font-black text-xl">{goalsBySport.b}</div>
                <div className="text-xs text-text-muted">Básquet</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-surface-dark mb-4">
            <div className="font-bold text-sm mb-3">
              HISTORIAL DE ACTIVIDADES
            </div>
            {playerActivities.length === 0 ? (
              <Empty text="Sin actividades" />
            ) : (
              <div className="flex flex-col gap-2">
                {playerActivities.slice(0, 10).map((a) => {
                  const pts = actPts(player.id, a, participants);
                  const team = a.equipos?.[player.id];
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-2 bg-surface-dark rounded-lg"
                    >
                      <div className="text-sm text-text-muted w-20">
                        {formatDate(a.fecha)}
                      </div>
                      <div className="flex-1 font-bold text-sm truncate">
                        {a.titulo || "Actividad"}
                      </div>
                      {team && (
                        <span
                          className="text-xs font-bold"
                          style={{ color: TEAM_COLORS[team] }}
                        >
                          {team}
                        </span>
                      )}
                      <div className="font-black text-primary">{pts} pts</div>
                    </div>
                  );
                })}
                {playerActivities.length > 10 && (
                  <div className="text-center text-xs text-text-muted">
                    +{playerActivities.length - 10} más
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 border border-surface-dark">
            <div className="font-bold text-sm mb-3">ESTADÍSTICAS</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Puntualidades</span>
                {stats.acts > 0 ? (
                  <Star className="w-5 h-5 text-primary fill-primary" />
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Bibliotecas</span>
                {stats.acts > 0 ? (
                  <BookOpen className="w-5 h-5 text-primary" />
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Invitados</span>
                {stats.acts > 0 ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Promedio</span>
                <span className="font-bold">
                  {stats.acts > 0 ? (stats.total / stats.acts).toFixed(1) : 0}
                  /act
                </span>
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
    </>
  );
}
