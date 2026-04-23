"use client";

import { useViewContext } from "../layout";
import { Gamepad2 } from "lucide-react";
import { Empty } from "@/components/ui/Common";

export default function JuegosPage() {
  const { act } = useViewContext();
  
  if (!act) return null;
  
  const juegos = act.juegos || [];
  
  if (!juegos.length) {
    return <Empty className="text-accent" text="Sin juegos registrados" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="font-bold text-sm text-accent mb-2 flex items-center gap-2">
        <Gamepad2 className="w-4 h-4" /> Juegos Mixtos
      </div>
      {juegos.map((j: any) => {
        const posToTeams: Record<string, string[]> = {};
        Object.entries(j.pos || {}).forEach(([pos, equipos]) => {
          if (!posToTeams[pos]) posToTeams[pos] = [];
          if (Array.isArray(equipos)) posToTeams[pos].push(...equipos);
        });
        const usedPositions = Object.keys(posToTeams)
          .map(Number)
          .sort((a, b) => a - b);

        return (
          <div
            key={j.id}
            className="bg-white rounded-xl border border-surface-dark overflow-hidden"
          >
            <div className="p-3 border-b border-surface-dark font-bold">
              {j.nombre || `Juego`}
            </div>
            <div className="flex flex-col gap-1 p-2">
              {usedPositions.map((pos) => {
                const teams = posToTeams[pos];
                return (
                  <div
                    key={pos}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${pos === 1 ? "bg-surface-dark" : "bg-background"}`}
                  >
                    <div className="text-xs font-bold w-4">{pos}</div>
                    <div className="flex gap-1.5 flex-wrap flex-1">
                      {teams.map((t: string) => (
                        <span
                          key={t}
                          className="font-black text-sm px-2 py-0.5 rounded-lg bg-gray-100"
                        >
                          {t}
                        </span>
                      ))}
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