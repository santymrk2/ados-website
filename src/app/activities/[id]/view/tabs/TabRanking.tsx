"use client";

import { useState, useMemo } from "react";
import { Clock, BookOpen, Trophy, Star, Medal } from "lucide-react";
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
import type { Activity, ParticipantBasic, Ranking, Gol, Invitacion } from "@/lib/types";

interface PlayerRankItem extends ParticipantBasic {
  pts: number;
  displayValue?: number;
  displayLabel?: string;
}

const PODIUM_COLORS = [
  {
    bg: "bg-amber-400",
    text: "text-amber-900",
    border: "border-amber-200",
    shadow: "shadow-amber-200",
    icon: Trophy,
  },
  {
    bg: "bg-slate-300",
    text: "text-slate-700",
    border: "border-slate-100",
    shadow: "shadow-slate-100",
    icon: Medal,
  },
  {
    bg: "bg-orange-400",
    text: "text-orange-900",
    border: "border-orange-200",
    shadow: "shadow-orange-200",
    icon: Medal,
  },
];

interface TabRankingProps {
  playerRank: PlayerRankItem[];
  act: Activity;
}

export function TabRanking({ playerRank, act }: TabRankingProps) {
  const [rankingType, setRankingType] = useState("puntos");

  const availableRankingTypes = useMemo(() => {
    const types = [
      { value: "puntos", label: "Puntaje General" },
      { value: "invitados", label: "Jugadores Traídos" },
    ];

    const has = {
      f: { m: false, f: false },
      h: { m: false, f: false },
      b: { m: false, f: false },
    };

    (act.goles || []).forEach((g) => {
      const p = playerRank.find((pr) => pr.id === g.pid);
      if (p && p.sexo) {
        const s = p.sexo.toLowerCase();
        if (has[g.tipo] && (s === "m" || s === "f")) {
          has[g.tipo][s] = true;
        }
      }
    });

    types.push({ value: "goles_f_m", label: "Fútbol (Masculino)" });
    types.push({ value: "goles_f_f", label: "Fútbol (Femenino)" });

    if (has.h.m) types.push({ value: "goles_h_m", label: "Handball (Masc)" });
    if (has.h.f) types.push({ value: "goles_h_f", label: "Handball (Fem)" });
    if (has.b.m) types.push({ value: "goles_b_m", label: "Básquet (Masc)" });
    if (has.b.f) types.push({ value: "goles_b_f", label: "Básquet (Fem)" });

    return types;
  }, [act.goles, act.invitaciones, playerRank]);

  const currentList = useMemo(() => {
    if (rankingType === "puntos") {
      return playerRank.map((p) => ({
        ...p,
        displayValue: p.pts,
        displayLabel: "pts",
      }));
    }

    // Ranking de invitados traídos
    if (rankingType === "invitados") {
      const invitaciones = act.invitaciones || [];
      return playerRank
        .map((p) => {
          const count = invitaciones.filter(
            (i) => i.invitador === p.id && i.invitadoId,
          ).length;
          return {
            ...p,
            displayValue: count,
            displayLabel: count === 1 ? "invitado" : "invitados",
          };
        })
        .filter((p) => p.displayValue > 0)
        .sort((a, b) => b.displayValue - a.displayValue);
    }

    const [, sportType, gender] = rankingType.split("_");

    return playerRank
      .filter((p) => p.sexo?.toLowerCase() === gender)
      .map((p) => {
        const sportGoals = (act.goles || [])
          .filter((g) => g.pid === p.id && g.tipo === sportType)
          .reduce((sum, g) => sum + g.cant, 0);
        return {
          ...p,
          displayValue: sportGoals,
          displayLabel: "goles",
        };
      })
      .filter((p) => p.displayValue > 0)
      .sort((a, b) => b.displayValue - a.displayValue);
  }, [playerRank, rankingType, act.goles, act.invitaciones]);

  if (!playerRank || playerRank.length === 0) {
    return <Empty className="text-accent" text="Sin asistentes para rankear" />;
  }

  const top3 = currentList.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between -mb-4 z-20 relative">
        <Select value={rankingType} onValueChange={setRankingType}>
          <SelectTrigger className="w-[180px] h-9 text-xs font-bold bg-white/50 border-surface-dark/50 backdrop-blur-sm text-primary">
            <SelectValue placeholder="Tipo de ranking" />
          </SelectTrigger>
          <SelectContent>
            {availableRankingTypes.map((t) => (
              <SelectItem
                key={t.value}
                value={t.value}
                className="text-xs font-bold"
              >
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <HelpInfo
          title="Sistema de Ranking"
          text="El ranking permite ver los mejores puntajes o los que hicieron más goles por deporte."
        />
      </div>

      {currentList.length === 0 ? (
        <div className="pt-20 pb-4">
          <Empty className="text-accent" text="Nadie en esta categoría" />
        </div>
      ) : (
        <>
          {/* Podio Principal */}
          <div className="flex items-end justify-center gap-2 pt-12 pb-4 px-2 relative min-h-[300px]">
            {/* Segundo Puesto */}
            {second && (
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="relative mb-2">
                  <Avatar p={second} size={56} />
                  <div className="absolute -top-2 -right-2 bg-slate-100 rounded-full p-1 shadow-sm border border-slate-200">
                    <Medal className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
                <div className="text-[10px] font-black text-center truncate w-full px-1 mb-1 text-white">
                  {second.nombre} {second.apellido[0]}.
                </div>
                <div
                  className={cn(
                    "w-full rounded-t-2xl flex flex-col items-center justify-start pt-3 gap-1 shadow-lg",
                    PODIUM_COLORS[1].bg,
                  )}
                  style={{ height: "100px" }}
                >
                  <span className="text-white font-black text-2xl drop-shadow-md">
                    2°
                  </span>
                  <span className="text-white/90 text-[10px] font-bold">
                    {second.displayValue} {second.displayLabel}
                  </span>
                </div>
              </div>
            )}

            {/* PRIMER PUESTO (Destacado) */}
            {first && (
              <div className="flex flex-col items-center flex-1 z-20 -mb-4">
                <div className="relative mb-3 scale-110">
                  <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-20 animate-pulse" />
                  <Avatar p={first} size={90} />
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Trophy className="w-8 h-8 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-bounce" />
                  </div>
                </div>
                <div className="text-sm font-black text-center truncate w-full px-1 mb-1 text-white">
                  {first.nombre} {first.apellido[0]}.
                </div>
                {act.equipos?.[first.id] && (
                  <div className="mb-2">
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter"
                      style={{
                        backgroundColor: getTeamBg(act.equipos[first.id]),
                        color: TEAM_COLORS[act.equipos[first.id]],
                      }}
                    >
                      Equipo {act.equipos[first.id]}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "w-full rounded-t-3xl flex flex-col items-center justify-start pt-4 gap-1 shadow-2xl relative overflow-hidden",
                    PODIUM_COLORS[0].bg,
                  )}
                  style={{ height: "140px" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
                  <span className="text-white font-black text-4xl drop-shadow-lg">
                    1°
                  </span>
                  <span className="text-white font-black text-sm uppercase tracking-widest">
                    {first.displayValue} {first.displayLabel.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Tercer Puesto */}
            {third && (
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="relative mb-2">
                  <Avatar p={third} size={48} />
                  <div className="absolute -top-2 -right-2 bg-orange-100 rounded-full p-1 shadow-sm border border-orange-200">
                    <Medal className="w-3 h-3 text-orange-700" />
                  </div>
                </div>
                <div className="text-[10px] font-black text-center truncate w-full px-1 mb-1 text-white">
                  {third.nombre} {third.apellido[0]}.
                </div>
                <div
                  className={cn(
                    "w-full rounded-t-2xl flex flex-col items-center justify-start pt-3 gap-1 shadow-lg",
                    PODIUM_COLORS[2].bg,
                  )}
                  style={{ height: "70px" }}
                >
                  <span className="text-white font-black text-xl drop-shadow-md">
                    3°
                  </span>
                  <span className="text-white/80 text-[10px] font-bold">
                    {third.displayValue} {third.displayLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Listado Completo */}
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-1 border border-surface-dark shadow-inner">
            <div className="px-4 py-3 flex items-center justify-between border-b border-surface-dark/50">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="font-black text-xs uppercase tracking-widest text-primary">
                  {rankingType === "puntos" ? "Listado General" : "Goleadores"}
                </span>
              </div>
              <span className="text-[10px] font-bold text-text-muted">
                {currentList.length} Jugadores
              </span>
            </div>

            <div className="flex flex-col">
              {currentList.map((p, i) => {
                const isTop3 = i < 3;
                const team = act.equipos?.[p.id];

                return (
                  <div
                    key={p.id}
                    className={cn(
                      "p-4 flex items-center gap-4 transition-all hover:bg-white/80 border-b border-surface-dark/30 last:border-0",
                      isTop3 && "bg-white/40",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm",
                        i === 0
                          ? "bg-amber-400 text-white"
                          : i === 1
                            ? "bg-slate-300 text-slate-700"
                            : i === 2
                              ? "bg-orange-300 text-orange-800"
                              : "bg-surface-dark text-text-muted",
                      )}
                    >
                      {i + 1}
                    </div>

                    <Avatar p={p} size={40} />

                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm text-dark truncate">
                        {p.nombre} {p.apellido}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {team && (
                          <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase"
                            style={{
                              backgroundColor: getTeamBg(team),
                              color: TEAM_COLORS[team],
                            }}
                          >
                            {team}
                          </span>
                        )}
                        <div className="flex items-center gap-1 opacity-50">
                          {act.puntuales.includes(p.id) && (
                            <Clock className="w-3 h-3 text-cyan-600" />
                          )}
                          {act.biblias.includes(p.id) && (
                            <BookOpen className="w-3 h-3 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-primary leading-none">
                        {p.displayValue}
                      </div>
                      <div className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">
                        {p.displayLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
