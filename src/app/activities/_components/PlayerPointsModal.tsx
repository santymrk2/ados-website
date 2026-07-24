"use client";

import { useMemo } from "react";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { Button } from "@/components/ui/button";
import { CalendarCheck, CalendarX, Clock, Coffee, Zap, Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { TEAM_COLORS, getEdad } from "@/lib/constants";
import { actRankingPtsDetails } from "@/lib/calc";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import type { Activity, ParticipantBasic } from "@/lib/types";

interface PlayerPointsModalProps {
  player: ParticipantBasic;
  act: Activity;
  participants: ParticipantBasic[];
  onClose: () => void;
  canEdit?: boolean;
  locked?: boolean;
  fromEditMode?: boolean;
  performQuickUpdate?: (type: string, data: unknown) => Promise<unknown>;
  activeTeams?: string[];
}

export function PlayerPointsModal({
  player,
  act,
  participants,
  onClose,
  canEdit = false,
  locked = false,
  fromEditMode = false,
  performQuickUpdate,
  activeTeams = [],
}: PlayerPointsModalProps) {
  const { total, details } = useMemo(() => {
    const details = actRankingPtsDetails(player.id, act, participants);
    const total = details.reduce((sum, detail) => sum + detail.pts, 0);

    return { total, details };
  }, [player, act, participants]);

  const isPresent = act.asistentes.includes(player.id);
  const isPunctual = (act.puntuales || []).includes(player.id);
  const isSocial = (act.socials || []).includes(player.id);
  const team = act.equipos?.[String(player.id)];
  const tieneBiblia = act.biblias.includes(player.id);
  const edad = getEdad(player.fechaNacimiento);

  const withClose = (fn: () => Promise<void>) => {
    onClose();
    fn().catch(() => {});
  };

  const handleToggleAttendance = () => {
    if (!performQuickUpdate) return;
    withClose(async () => {
      await performQuickUpdate("attendance", {
        participantId: player.id,
        value: !isPresent,
      });
    });
  };

  const handleTogglePunctual = () => {
    if (!performQuickUpdate) return;
    withClose(async () => {
      if (!isPunctual && !isPresent) {
        await performQuickUpdate("attendance", {
          participantId: player.id,
          value: true,
        });
        await performQuickUpdate("puntuales", {
          participantId: player.id,
          value: true,
        });
      } else {
        await performQuickUpdate("puntuales", {
          participantId: player.id,
          value: !isPunctual,
        });
      }
    });
  };

  const handleToggleSocial = async () => {
    if (!performQuickUpdate) return;

    if (!isSocial && team) {
      const ok = await confirmDialog(
        "Al cambiar a Social, el equipo y los puntos acumulados en juegos se perderán.",
        {
          title: "Cambiar a Social",
          confirmText: "Cambiar",
          isDestructive: true,
        },
      );
      if (!ok) return;
    }

    withClose(async () => {
      await performQuickUpdate("socials", {
        participantId: player.id,
        value: !isSocial,
      });
    });
  };

  const handleAutoAssign = () => {
    if (!performQuickUpdate) return;

    const counts: Record<string, number> = {};
    for (const t of activeTeams) counts[t] = 0;
    for (const pid of act.asistentes) {
      const t = act.equipos?.[String(pid)];
      if (t && t in counts) counts[t]++;
    }

    const sorted = [...activeTeams].sort(
      (a, b) => counts[a] - counts[b] || a.localeCompare(b),
    );
    const targetTeam = sorted[0];
    if (!targetTeam) return;

    withClose(async () => {
      await performQuickUpdate("team", {
        participantId: player.id,
        team: targetTeam,
      });
    });
  };

  const handleSelectTeam = (selectedTeam: string) => {
    if (!performQuickUpdate) return;
    withClose(async () => {
      await performQuickUpdate("team", {
        participantId: player.id,
        team: selectedTeam,
      });
    });
  };

  const showActions = canEdit && !locked && fromEditMode;

  return (
    <DetailSheet
      open={!!player}
      onOpenChange={(open) => !open && onClose()}
      title={`${player.nombre} ${player.apellido}`}
    >
      {/* HEADER: Avatar + Info */}
      <div className="flex items-center gap-4 mb-4">
        <Avatar p={player} size={64} />
        <div className="flex-1">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {edad !== null && (
              <span className="text-xs font-bold text-text-muted bg-surface-dark px-2 py-0.5 rounded-full">
                {edad} años
              </span>
            )}
            {isSocial ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Social
              </span>
            ) : team ? (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: TEAM_COLORS[team] + "20",
                  color: TEAM_COLORS[team],
                }}
              >
                Equipo {team}
              </span>
            ) : isPresent ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-dark text-text-muted">
                Sin equipo
              </span>
            ) : null}
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                tieneBiblia
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-surface-dark text-text-muted",
              )}
            >
              {tieneBiblia ? "Trajo Biblia" : "No trajo Biblia"}
            </span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      {showActions && (
        <>
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleToggleAttendance}
              disabled={locked}
              className={cn(
                "flex items-center gap-1.5 justify-center h-10 px-3 text-sm font-bold transition-colors rounded-xl border flex-1",
                locked &&
                  "opacity-50 cursor-not-allowed pointer-events-none",
                isPresent
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface-dark text-text-muted border-surface-dark",
              )}
            >
              {isPresent ? (
                <CalendarCheck className="w-4 h-4" />
              ) : (
                <CalendarX className="w-4 h-4" />
              )}
              <span>{isPresent ? "Presente" : "Ausente"}</span>
            </button>
            <button
              onClick={handleTogglePunctual}
              disabled={locked}
              className={cn(
                "flex items-center gap-1.5 justify-center h-10 px-3 text-sm font-bold transition-colors rounded-xl border flex-1",
                locked &&
                  "opacity-50 cursor-not-allowed pointer-events-none",
                isPunctual
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface-dark text-text-muted border-surface-dark",
              )}
            >
              <Clock className="w-4 h-4" />
              <span>Puntual</span>
            </button>
            {isPresent && (
              <button
                onClick={handleToggleSocial}
                disabled={locked}
                className={cn(
                  "flex items-center gap-1.5 justify-center h-10 px-3 text-sm font-bold transition-colors rounded-xl border flex-1",
                  locked &&
                    "opacity-50 cursor-not-allowed pointer-events-none",
                  isSocial
                    ? "bg-[#F59E0B33] border-[#F59E0B66] text-[#F59E0B]"
                    : "bg-primary/20 border-primary/40 text-primary",
                )}
              >
                {isSocial ? (
                  <Coffee className="w-4 h-4" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>{isSocial ? "Social" : "Juegos"}</span>
              </button>
            )}
          </div>

          {/* TEAM SELECTOR */}
          {isPresent && !isSocial && activeTeams.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-text-muted mb-2">Equipo</div>
              <div className="flex gap-2 flex-wrap">
                {activeTeams.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSelectTeam(t)}
                    disabled={locked}
                    className={cn(
                      "flex items-center justify-center gap-1.5 h-9 px-4 text-sm font-bold transition-colors rounded-xl border",
                      locked &&
                        "opacity-50 cursor-not-allowed pointer-events-none",
                      team === t
                        ? "border-primary text-primary"
                        : "border-surface-dark text-text-muted hover:border-primary/40",
                    )}
                    style={{
                      backgroundColor: team === t ? TEAM_COLORS[t] + "15" : undefined,
                    }}
                  >
                    {team === t && <Check className="w-4 h-4" />}
                    <span>{t}</span>
                  </button>
                ))}
              </div>

              {/* AUTO ASSIGN */}
              {!team && (
                <button
                  onClick={handleAutoAssign}
                  disabled={locked}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 h-9 px-4 text-sm font-bold transition-colors rounded-xl border mt-2",
                    locked &&
                      "opacity-50 cursor-not-allowed pointer-events-none",
                    "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20",
                  )}
                >
                  <Zap className="w-4 h-4" />
                  Asignar automáticamente
                </button>
              )}
            </div>
          )}

          {/* DIVIDER */}
          <div className="border-t border-surface-dark my-3" />
        </>
      )}

      {/* POINTS DISPLAY */}
      <div className="bg-primary text-white rounded-2xl p-4 text-center mb-5">
        <div className="text-4xl font-black tabular-nums">{total}</div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">
          Puntos Totales
        </div>
      </div>

      {/* POINTS BREAKDOWN */}
      <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
        {details.map((d, i) => (
          <div
            key={i}
            className="flex justify-between items-center bg-primary/5 rounded-xl px-3 py-2.5 border border-primary/10"
          >
            <span className="text-sm font-bold text-dark">
              {d.label}
              {d.sublabel && (
                <span className="ml-1 text-xs font-medium text-text-muted">
                  · {d.sublabel}
                </span>
              )}
            </span>
            <span
              className={cn(
                "font-black text-sm tabular-nums",
                d.pts >= 0 ? "text-green-600" : "text-red-500",
              )}
            >
              {d.pts >= 0 ? "+" : ""}
              {d.pts}
            </span>
          </div>
        ))}
        {details.length === 0 && (
          <div className="text-center text-text-muted text-sm py-8 font-medium italic">
            Sin puntos registrados aún
          </div>
        )}
      </div>
    </DetailSheet>
  );
}
