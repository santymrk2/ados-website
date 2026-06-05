"use client";

import { useState, useMemo, useEffect } from "react";
import { useViewContext } from "../layout";
import { Trophy, Medal } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Empty } from "@/components/ui/Common";
import { HelpInfo } from "@/components/ui/HelpInfo";
import { cn } from "@/lib/utils";
import type { Invitacion, Gol } from "@/lib/types";

export default function RankingPage() {
  const { playerRank, act, setFilterContent } = useViewContext();
  const [rankingType, setRankingType] = useState("puntos");
  const [goalSexo, setGoalSexo] = useState<string | null>(null);

  // Limpiar filtro al desmontar
  useEffect(() => {
    return () => setFilterContent(null);
  }, [setFilterContent]);

  // Setear filtro en el FloatingNav
  useEffect(() => {
    setFilterContent(
      <div className="space-y-4">
        {/* Tipo de ranking */}
        <div>
          <div className="text-[10px] font-bold text-text-muted uppercase mb-2">
            Tipo
          </div>
          <div className="flex gap-1">
            {[
              { value: "puntos", label: "Puntaje" },
              { value: "goles", label: "Goles" },
              { value: "invitados", label: "Invitados" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setRankingType(opt.value);
                  if (opt.value !== "goles") setGoalSexo(null);
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                  rankingType === opt.value
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-light text-text-muted hover:bg-surface-dark/30"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sexo (solo cuando Goles está seleccionado) */}
        {rankingType === "goles" && (
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase mb-2">
              Sexo
            </div>
            <div className="flex gap-1">
              {[
                { value: null as string | null, label: "Ambos" },
                { value: "M", label: "Varones" },
                { value: "F", label: "Mujeres" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setGoalSexo(opt.value)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                    goalSexo === opt.value
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-light text-text-muted hover:bg-surface-dark/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [rankingType, goalSexo, setFilterContent]);

  // Calcular goleadores traídos
  const invitedCount = useMemo(() => {
    if (!act) return {};
    const counts: Record<number, number> = {};
    (act.invitaciones || []).forEach((inv: Invitacion) => {
      if (inv.invitador) {
        counts[inv.invitador] = (counts[inv.invitador] || 0) + 1;
      }
    });
    return counts;
  }, [act, act?.invitaciones]);

  const rankingData = useMemo(() => {
    if (!act) return playerRank;
    if (rankingType === "puntos") {
      return playerRank;
    }
    if (rankingType === "invitados") {
      return playerRank.map((p) => ({
        ...p,
        pts: invitedCount[p.id] || 0,
      })).sort((a, b) => (b.pts || 0) - (a.pts || 0));
    }
    // Goles con filtro de sexo
    return playerRank
      .map((p) => {
        const misGoles = (act.goles || [])
          .filter((g: Gol) => {
            if (g.pid !== p.id) return false;
            if (goalSexo && g.sexo !== goalSexo) return false;
            return true;
          })
          .reduce((s: number, g: Gol) => s + (g.cant || 0), 0);
        return { ...p, pts: misGoles };
      })
      .sort((a, b) => b.pts - a.pts);
  }, [playerRank, rankingType, goalSexo, invitedCount, act, act?.goles]);

  // Label for the points column based on ranking type
  const pointsLabel = useMemo(() => {
    if (rankingType === "invitados") return "invitados";
    if (rankingType === "goles") return "goles";
    return "pts";
  }, [rankingType]);

  if (!act) return null;

  const top3 = rankingData.slice(0, 3);
  const rest = rankingData.slice(3);

  return (
    <div>
      <div className="mb-4">
        <HelpInfo
          title="Ranking"
          text="Ranking general de jugadores por puntos, goles o invitados."
        />
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="flex justify-center items-end gap-2 mb-6">
          {top3[1] && (
            <div className="flex flex-col items-center">
              <Avatar p={top3[1]} size={48} />
              <div className="mt-2 text-center">
                <div className="font-bold text-sm text-white truncate max-w-[100px]">
                  {top3[1].nombre}
                </div>
                <div className="text-xs text-white/60">{top3[1].pts} {pointsLabel}</div>
              </div>
              <div className="w-16 h-16 bg-slate-300 rounded-t-xl flex items-center justify-center">
                <Medal className="w-8 h-8 text-slate-600" />
              </div>
            </div>
          )}
          {top3[0] && (
            <div className="flex flex-col items-center">
              <Avatar p={top3[0]} size={56} />
              <div className="mt-2 text-center">
                <div className="font-bold text-sm text-white truncate max-w-[100px]">
                  {top3[0].nombre}
                </div>
                <div className="text-xs text-white/60">{top3[0].pts} {pointsLabel}</div>
              </div>
              <div className="w-20 h-20 bg-amber-400 rounded-t-xl flex items-center justify-center">
                <Trophy className="w-10 h-10 text-amber-900" />
              </div>
            </div>
          )}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <Avatar p={top3[2]} size={48} />
              <div className="mt-2 text-center">
                <div className="font-bold text-sm text-white truncate max-w-[100px]">
                  {top3[2].nombre}
                </div>
                <div className="text-xs text-white/60">{top3[2].pts} {pointsLabel}</div>
              </div>
              <div className="w-16 h-16 bg-orange-400 rounded-t-xl flex items-center justify-center">
                <Medal className="w-8 h-8 text-orange-900" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resto del ranking */}
      <div className="flex flex-col gap-2">
        {rest.map((p, i) => (
          <div
            key={p.id}
            className="bg-white/90 rounded-xl p-3 flex items-center gap-3"
          >
            <div className="w-7 h-7 flex items-center justify-center font-bold text-xs text-text-muted">
              {i + 4}
            </div>
            <Avatar p={p} size={30} />
            <div className="flex-1">
              <div className="font-bold text-sm">
                {p.nombre} {p.apellido}
              </div>
            </div>
            <div className="font-black text-lg">{p.pts} {pointsLabel}</div>
          </div>
        ))}
      </div>

      {rankingData.length === 0 && (
        <Empty className="text-accent" text="Sin datos para el ranking" />
      )}
    </div>
  );
}