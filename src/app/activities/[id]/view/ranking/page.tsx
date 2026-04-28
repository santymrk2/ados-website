"use client";

import { useState, useMemo } from "react";
import { useViewContext } from "../layout";
import { Trophy, Medal, Star } from "lucide-react";
import { TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { Empty } from "@/components/ui/Common";
import { HelpInfo } from "@/components/ui/HelpInfo";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Invitacion, Gol } from "@/lib/types";

const PODIUM_COLORS = [
  { bg: "bg-amber-400", text: "text-amber-900", border: "border-amber-200", icon: Trophy },
  { bg: "bg-slate-300", text: "text-slate-700", border: "border-slate-100", icon: Medal },
  { bg: "bg-orange-400", text: "text-orange-900", border: "border-orange-200", icon: Medal },
];

export default function RankingPage() {
  const { playerRank, act } = useViewContext();
  const [rankingType, setRankingType] = useState("puntos");

  if (!act) return null;

  // Calcular goleadores traídos
  const invitedCount = useMemo(() => {
    const counts: Record<number, number> = {};
    (act.invitaciones || []).forEach((inv: Invitacion) => {
      if (inv.invitador) {
        counts[inv.invitador] = (counts[inv.invitador] || 0) + 1;
      }
      // Verificar si hay invitadorId también
      if (inv.invitadorId) {
        counts[inv.invitadorId] = (counts[inv.invitadorId] || 0) + 1;
      }
    });
    
    // Imprimir para debug
    console.log('Invitaciones:', act.invitaciones);
    console.log('Conteo de invitados:', counts);
    return counts;
  }, [act.invitaciones]);

const rankingData = useMemo(() => {
    if (rankingType === "puntos") {
      // Verificar duplicados en playerRank
      const ids = playerRank.map(p => p.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        console.log('IDs duplicados encontrados en playerRank:', ids);
        console.log('IDs únicos:', Array.from(new Set(ids)));
      }
      return playerRank;
    }
    if (rankingType === "invitados") {
      // Verificar si hay duplicados en playerRank
      const data = playerRank.map((p) => ({
        ...p,
        pts: invitedCount[p.id] || 0,
      }));
      
      // Verificar duplicados
      const ids = playerRank.map(p => p.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        console.log('IDs duplicados encontrados:', ids);
        console.log('IDs únicos:', Array.from(new Set(ids)));
      }
      
      return playerRank.map((p) => ({
        ...p,
        pts: invitedCount[p.id] || 0,
      })).sort((a, b) => (b.pts || 0) - (a.pts || 0));
    }
    // Goles por tipo
    const [_, tipo, sexo] = rankingType.split("_");
    return playerRank
      .map((p) => {
        const misGoles = (act.goles || [])
          .filter((g: Gol) => g.pid === p.id && g.tipo === tipo && g.sexo === sexo)
          .reduce((s: number, g: Gol) => s + (g.cant || 0), 0);
        return { ...p, pts: misGoles };
      })
      .sort((a, b) => b.pts - a.pts);
  }, [playerRank, rankingType, invitedCount, act]);

  const top3 = rankingData.slice(0, 3);
  const rest = rankingData.slice(3);

  const allSameScore = useMemo(() => {
    if (rankingData.length === 0) return false;
    const firstScore = rankingData[0]?.pts || 0;
    return rankingData.every(p => p.pts === firstScore);
  }, [rankingData]);

  const showPodium = top3.length > 0 && !allSameScore;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <HelpInfo
          title="Ranking"
          text="Ranking general de jugadores por puntos, goles o invitados."
        />
        <Select value={rankingType} onValueChange={setRankingType}>
          <SelectTrigger className="w-40 bg-white/20 text-white border-white/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="puntos">Puntaje</SelectItem>
            <SelectItem value="invitados">Invitados</SelectItem>
            <SelectItem value="goles_f_m">Fútbol M</SelectItem>
            <SelectItem value="goles_f_f">Fútbol F</SelectItem>
          </SelectContent>
        </Select>
      </div>

{/* Podium */}
      {showPodium && (
        <div className="flex justify-center items-end gap-2 mb-6">
          {top3[1] && (
            <div className="flex flex-col items-center">
              <Avatar p={top3[1]} size={48} />
              <div className="mt-2 text-center">
                <div className="font-bold text-sm text-white truncate max-w-[100px]">
                  {top3[1].nombre}
                </div>
                <div className="text-xs text-white/60">
                  {rankingType === "invitados" ? `${top3[1].pts} invitados` : `${top3[1].pts} pts`}
                </div>
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
                <div className="text-xs text-white/60">
                  {rankingType === "invitados" ? `${top3[0].pts} invitados` : `${top3[0].pts} pts`}
                </div>
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
                <div className="text-xs text-white/60">
                  {rankingType === "invitados" ? `${top3[2].pts} invitados` : `${top3[2].pts} pts`}
                </div>
              </div>
              <div className="w-16 h-16 bg-orange-400 rounded-t-xl flex items-center justify-center">
                <Medal className="w-8 h-8 text-orange-900" />
              </div>
            </div>
          )}
        </div>
      )}
          {top3[0] && (
            <div className="flex flex-col items-center">
              <Avatar p={top3[0]} size={56} />
              <div className="mt-2 text-center">
                <div className="font-bold text-sm text-white truncate max-w-[100px]">
                  {top3[0].nombre}
                </div>
                <div className="text-xs text-white/60">
                  {rankingType === "invitados" ? `${top3[0].pts} invitados` : `${top3[0].pts} pts`}
                </div>
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
                <div className="text-xs text-white/60">
                  {rankingType === "invitados" ? `${top3[2].pts} invitados` : `${top3[2].pts} pts`}
                </div>
              </div>
              <div className="w-16 h-16 bg-orange-400 rounded-t-xl flex items-center justify-center">
                <Medal className="w-8 h-8 text-orange-900" />
              </div>
            </div>
          )}
        </div>
      )}
          {top3[0] && (
            <div className="flex flex-col items-center">
              <Avatar p={top3[0]} size={56} />
              <div className="mt-2 text-center">
                <div className="font-bold text-sm text-white truncate max-w-[100px]">
                  {top3[0].nombre}
                </div>
                <div className="text-xs text-white/60">{top3[0].pts} pts</div>
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
                <div className="text-xs text-white/60">{top3[2].pts} pts</div>
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
            <div className="font-black text-lg">
              {rankingType === "invitados" ? `${p.pts} invitados` : `${p.pts} pts`}
            </div>
          </div>
        ))}
      </div>

      {rankingData.length === 0 && (
        <Empty className="text-accent" text="Sin datos para el ranking" />
      )}
    </div>
  );
}