"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpInfo } from "@/components/HelpInfo";
import { Empty } from "@/components/Common";
import { Avatar } from "@/components/Avatar";
import { TEAM_COLORS } from "@/lib/constants";

export function TabGoleadores({
  act,
  showScorers,
  setShowScorers,
  scorersByDeporte,
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <HelpInfo
            title="Goleadores"
            text="Aquí se listan los goleadores registrados en los partidos de hoy (Fútbol, Handball, Básquet) y los goles cargados manualmente."
          />
          <span className="text-xs text-white/70 font-bold uppercase">
            Goleadores
          </span>
        </div>
        <Button
          onClick={() => setShowScorers(!showScorers)}
          variant="outline"
          size="icon"
          className="w-11 h-11 rounded-xl bg-white/20 text-white border-white/30 hover:bg-white/30"
        >
          {showScorers ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </Button>
      </div>
      {showScorers && (
        <div className="flex flex-col gap-6">
          {[
            { key: "f", label: "⚽ Fútbol" },
            { key: "h", label: "🤾 Handball" },
            { key: "b", label: "🏀 Básquet" },
          ].map(({ key, label }) => {
            const items = scorersByDeporte[key];
            if (items.length === 0) return null;
            return (
              <div key={key}>
                <div className="font-black text-sm text-white/80 mb-3 uppercase tracking-wider">
                  {label}
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((p, i) => (
                    <div
                      key={`${p.id}-${key}`}
                      className="bg-white/90 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 border border-white/20"
                    >
                      <div className="w-7 h-7 flex items-center justify-center font-black text-xs bg-primary/20 text-primary rounded-full flex-shrink-0">
                        {i + 1}
                      </div>
                      <Avatar p={p} size={30} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-dark truncate">
                          {p.nombre} {p.apellido}
                        </div>
                        {act.equipos?.[p.id] && (
                          <div
                            className="text-[10px] font-bold"
                            style={{
                              color: TEAM_COLORS[act.equipos[p.id]],
                            }}
                          >
                            {act.equipos[p.id]}
                          </div>
                        )}
                      </div>
                      <div className="font-black text-lg">⚽ {p.goles}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.values(scorersByDeporte).every((l) => l.length === 0) && (
            <Empty className="text-accent" text="Sin goles registrados" />
          )}
        </div>
      )}
      {!showScorers && (
        <Empty className="text-accent" text="Goleadores ocultos" />
      )}
    </div>
  );
}
