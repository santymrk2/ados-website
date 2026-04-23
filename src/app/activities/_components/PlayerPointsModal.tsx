"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { TEAM_COLORS, getEdad, PTS } from "@/lib/constants";
import { actGoles } from "@/lib/calc";
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
    const pid = player.id;
    const a = act;
    const team = a.equipos?.[String(pid)];
    const details: { label: string; pts: number }[] = [];
    let total = 0;

    if (a.asistentes.includes(pid)) {
      details.push({ label: "Asistencia", pts: PTS.asistencia });
      total += PTS.asistencia;

      if (a.puntuales.includes(pid)) {
        details.push({ label: "Puntualidad", pts: PTS.puntualidad });
        total += PTS.puntualidad;
      }
      if (a.biblias.includes(pid)) {
        details.push({ label: "Biblia", pts: PTS.biblia });
        total += PTS.biblia;
      }

      const isSocial = (a.socials || []).includes(pid);
      if (isSocial) {
        for (const _j of a.juegos || []) {
          details.push({ label: "Juego Social", pts: PTS.rec[4] || 0 });
          total += PTS.rec[4] || 0;
        }
      } else if (team) {
        for (const j of a.juegos || []) {
          let position;
          if (j.pos && typeof j.pos === "object") {
            for (const [posStr, equipos] of Object.entries(j.pos)) {
              if (Array.isArray(equipos) && equipos.includes(team)) {
                position = Number(posStr);
                break;
              }
            }
          }
          if (position !== undefined) {
            const pts = PTS.rec[position] || 0;
            details.push({ label: `${j.nombre || "Juego"} (${position}°)`, pts });
            total += pts;
          }
        }
      }

      const invCount = (a.invitaciones || []).filter((i) => i.invitador === pid).length;
      if (invCount > 0) {
        details.push({ label: `Invitaciones (x${invCount})`, pts: invCount * PTS.invite });
        total += invCount * PTS.invite;
      }
    }

    for (const e of a.extras || []) {
      if (e.pid === pid || (team && e.team === team)) {
        details.push({ label: e.desc || "Extra", pts: e.puntos });
        total += e.puntos;
      }
    }
    for (const d of a.descuentos || []) {
      if (d.pid === pid || (team && d.team === team)) {
        details.push({ label: d.desc || "Descuento", pts: -d.puntos });
        total -= d.puntos;
      }
    }

    const goles = actGoles(pid, a);
    if (goles > 0) {
      details.push({ label: "Goles", pts: goles });
      total += goles;
    }

    return { total, details };
  }, [player, act, participants]);

  const team = act.equipos?.[String(player.id)];
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
                    backgroundColor: TEAM_COLORS[team] + '20',
                    color: TEAM_COLORS[team] 
                  }}
                >
                  Equipo {team}
                </span>
              )}
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
              <span className="text-sm font-bold text-slate-700">{d.label}</span>
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
