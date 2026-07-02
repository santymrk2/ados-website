"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { actRankingPtsDetails } from "@/lib/calc";
import { cn, formatDate } from "@/lib/utils";
import type { Activity, ParticipantBasic } from "@/lib/types";

interface PlayerHistoryModalProps {
  player: ParticipantBasic;
  activities: Activity[];
  participants: ParticipantBasic[];
  onClose: () => void;
}

export function PlayerHistoryModal({
  player,
  activities,
  participants,
  onClose,
}: PlayerHistoryModalProps) {
  const activityHistory = useMemo(() => {
    return activities
      .map((activity) => {
        const details = actRankingPtsDetails(player.id, activity, participants);
        const total = details.reduce((sum, detail) => sum + detail.pts, 0);
        return { activity, details, total };
      })
      .filter((item) => item.details.length > 0)
      .sort(
        (a, b) =>
          new Date(b.activity.fecha).getTime() - new Date(a.activity.fecha).getTime(),
      );
  }, [activities, participants, player.id]);

  const total = activityHistory.reduce((sum, item) => sum + item.total, 0);

  return (
    <Dialog open={!!player} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg bg-white rounded-3xl p-0 flex flex-col overflow-hidden max-h-[90vh] shadow-2xl border-none"
      >
        <DialogTitle className="sr-only">
          Historial de puntajes de {player.nombre} {player.apellido}
        </DialogTitle>

        <div className="p-5 border-b border-surface-dark bg-white shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-4 pr-10">
            <Avatar p={player} size={72} />
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-xl text-foreground leading-tight truncate">
                {player.nombre} {player.apellido}
              </h3>
              <div className="text-xs font-bold text-text-muted mt-1">
                {activityHistory.length} actividades con puntos
              </div>
            </div>
          </div>

          <div className="bg-primary text-white rounded-2xl p-4 text-center mt-4 shadow-inner">
            <div className="text-4xl font-black tabular-nums">{total}</div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">
              Puntos Totales
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-background custom-scrollbar">
          {activityHistory.length > 0 ? (
            <div className="flex flex-col gap-3">
              {activityHistory.map(({ activity, details, total: activityTotal }) => (
                <div
                  key={activity.id}
                  className="bg-white rounded-2xl border border-surface-dark p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="font-black text-foreground truncate">
                        {activity.titulo || formatDate(activity.fecha)}
                      </div>
                      <div className="text-xs font-bold text-text-muted mt-1">
                        {formatDate(activity.fecha)}
                      </div>
                    </div>
                    <div className="bg-primary/10 text-primary rounded-xl px-3 py-1 text-sm font-black tabular-nums shrink-0">
                      {activityTotal >= 0 ? "+" : ""}
                      {activityTotal}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {details.map((detail, index) => (
                      <div
                        key={`${detail.type}-${detail.label}-${index}`}
                        className="flex items-center justify-between gap-3 bg-surface-light rounded-xl px-3 py-2 border border-surface-dark/60"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-foreground truncate">
                            {detail.label}
                          </div>
                          {detail.sublabel && (
                            <div className="text-xs font-medium text-text-muted truncate">
                              {detail.sublabel}
                            </div>
                          )}
                        </div>
                        <div
                          className={cn(
                            "font-black text-sm tabular-nums shrink-0",
                            detail.pts >= 0 ? "text-green-600" : "text-red-500",
                          )}
                        >
                          {detail.pts >= 0 ? "+" : ""}
                          {detail.pts}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-text-muted text-sm py-10 font-medium italic">
              Sin puntos registrados aún
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
