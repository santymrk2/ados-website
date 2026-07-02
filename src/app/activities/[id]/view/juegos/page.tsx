"use client";

import { useMemo } from "react";
import { useViewContext } from "../layout";
import { Gamepad2, Users } from "lucide-react";
import { TEAM_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Empty } from "@/components/ui/Common";
import type { Juego } from "@/lib/types";

const POSITIONS = ["1", "2", "3", "4"] as const;

function gameTypeLabel(tipo: string | undefined) {
  return tipo === "individual" ? "Individual" : "Grupal";
}

export default function JuegosPage() {
  const { act, db } = useViewContext();
  const participants = db.participants;

  const participantById = useMemo(() => {
    const map = new Map<number, (typeof participants)[number]>();
    for (const participant of participants) {
      map.set(participant.id, participant);
    }
    return map;
  }, [participants]);

  if (!act) return null;
  const juegos = act.juegos || [];

  const labelFor = (game: Juego, value: string) => {
    if (game.tipo === "individual") {
      const participant = participantById.get(Number(value));
      return participant ? `${participant.nombre} ${participant.apellido}` : value;
    }
    return value;
  };

  if (!juegos.length) {
    return <Empty text="Sin juegos registrados" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {juegos.map((j: Juego, index) => {
        const posEntries = Object.entries(j.pos || {})
          .filter(([pos]) => pos !== "0")
          .sort(([a], [b]) => Number(a) - Number(b));

        return (
          <div key={j.id} className="bg-white rounded-2xl border border-surface-dark overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-3 border-b border-surface-dark">
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">{j.nombre || `Juego ${index + 1}`}</div>
                <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-text-muted">
                  <span className="inline-flex items-center gap-1 rounded-full border border-surface-dark/60 bg-surface-light px-2 py-0.5 font-bold uppercase tracking-wide">
                    {j.tipo === "individual" ? <Users className="h-3 w-3" /> : <Gamepad2 className="h-3 w-3" />}
                    {gameTypeLabel(j.tipo)}
                  </span>
                  <span>{posEntries.length} puestos</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-2">
              {POSITIONS.map((pos) => {
                const values = (j.pos || {})[pos] || [];
                return (
                  <div key={pos} className="rounded-2xl border border-surface-dark/60 bg-surface-light/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">Puesto {pos}</div>
                      <div className="text-[11px] font-medium text-text-muted">{values.length} asignados</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {values.length > 0 ? (
                        values.map((value) => {
                          const isTeam = j.tipo === "grupal";
                          const teamColor = isTeam ? TEAM_COLORS[value] : undefined;
                          return (
                            <span
                              key={`${pos}-${value}`}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-semibold",
                                isTeam && teamColor
                                  ? "bg-white"
                                  : "border-surface-dark/50 bg-white text-foreground",
                              )}
                              style={isTeam && teamColor ? {
                                borderColor: teamColor,
                                color: teamColor,
                              } : undefined}
                            >
                              {labelFor(j, value)}
                            </span>
                          );
                        })
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-dashed border-surface-dark/60 px-3 py-1 text-xs font-medium text-text-muted">
                          Vacante
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
