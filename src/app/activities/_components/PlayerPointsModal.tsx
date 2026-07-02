"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { TEAM_COLORS, getEdad } from "@/lib/constants";
import { actRankingPtsDetails } from "@/lib/calc";
import type { Activity, ParticipantBasic } from "@/lib/types";

interface PlayerPointsModalProps {
  player: ParticipantBasic;
  act: Activity;
  participants: ParticipantBasic[];
  onClose: () => void;
}

export function PlayerPointsModal({
  player,
  act,
  participants,
  onClose,
}: PlayerPointsModalProps) {
  const { total, details } = useMemo(() => {
    const details = actRankingPtsDetails(player.id, act, participants);
    const total = details.reduce((sum, detail) => sum + detail.pts, 0);

    return { total, details };
  }, [player, act, participants]);

  const team = act.equipos?.[String(player.id)];
  const tieneBiblia = act.biblias.includes(player.id);
  const edad = getEdad(player.fechaNacimiento);

  return (
    <Dialog open={!!player} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm bg-white rounded-3xl p-5 flex flex-col overflow-y-auto max-h-[90vh] shadow-2xl border-none"
      >
        <DialogTitle className="sr-only">
          Detalle de {player.nombre} {player.apellido}
        </DialogTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-4 mb-4">
          <Avatar p={player} size={80} />
          <div className="flex-1">
            <h3 className="font-black text-xl text-slate-900 leading-tight">
              {player.nombre} {player.apellido}
            </h3>
            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
              {edad !== null && (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {edad} años
                </span>
              )}
              {team && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: TEAM_COLORS[team] + "20",
                    color: TEAM_COLORS[team],
                  }}
                >
                  Equipo {team}
                </span>
              )}
              <span
                className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  tieneBiblia
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {tieneBiblia ? "Trajo Biblia" : "No trajo Biblia"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-primary text-white rounded-2xl p-4 text-center mb-5 shadow-inner">
          <div className="text-4xl font-black tabular-nums">{total}</div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">
            Puntos Totales
          </div>
        </div>

        <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
          {details.map((d, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100"
            >
              <span className="text-sm font-bold text-slate-700">
                {d.label}
                {d.sublabel && (
                  <span className="ml-1 text-xs font-medium text-slate-400">
                    · {d.sublabel}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "font-black text-sm tabular-nums",
                  d.pts >= 0 ? "text-green-600" : "text-red-500"
                )}
              >
                {d.pts >= 0 ? "+" : ""}
                {d.pts}
              </span>
            </div>
          ))}
          {details.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-8 font-medium italic">
              Sin puntos registrados aún
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
