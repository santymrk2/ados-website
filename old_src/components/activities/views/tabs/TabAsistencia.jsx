"use client";

import { useState, useMemo } from "react";
import { getEdad } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Clock, Users } from "lucide-react";

function PlayerPointsModal({ player, act, participants, onClose }) {
  const { total, details } = useMemo(() => {
    const p = participants.find((x) => x.id === player.id);
    if (!p) return { total: 0, details: [] };

    const a = act;
    const team = a.equipos?.[player.id];
    const details = [];
    let total = 0;

    if (a.asistentes.includes(player.id)) {
      details.push({ label: "Asistencia", pts: 10 });
      total += 10;

      if (a.puntuales.includes(player.id)) {
        details.push({ label: "Puntualidad", pts: 5 });
        total += 5;
      }
      if (a.biblias.includes(player.id)) {
        details.push({ label: "Biblia", pts: 2 });
        total += 2;
      }

      const isSocial = (a.socials || []).includes(player.id);
      if (isSocial) {
        for (const _j of a.juegos || []) {
          details.push({ label: "Juego Social", pts: 2 });
          total += 2;
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
            const recPts = { 1: 10, 2: 7, 3: 4, 4: 2, 5: 1, 6: 0 };
            const pts = recPts[position] || 0;
            details.push({ label: `${j.nombre || "Juego"} (${position}°)`, pts });
            total += pts;
          }
        }
      }

      if ((a.invitaciones || []).some((i) => i.invitador === player.id)) {
        details.push({ label: "Invitación", pts: 5 });
        total += 5;
      }
    }

    for (const e of a.extras || []) {
      if (e.pid === player.id || (team && e.team === team)) {
        details.push({ label: e.desc || "Extra", pts: e.puntos });
        total += e.puntos;
      }
    }
    for (const d of a.descuentos || []) {
      if (d.pid === player.id || (team && d.team === team)) {
        details.push({ label: d.desc || "Descuento", pts: -d.puntos });
        total -= d.puntos;
      }
    }

    const goles = (a.goles || [])
      .filter((g) => g.pid === player.id)
      .reduce((s, g) => s + g.cant, 0);
    if (goles > 0) {
      details.push({ label: "Goles", pts: goles });
      total += goles;
    }

    return { total, details };
  }, [player, act, participants]);

  return (
    <Dialog open={!!player} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm bg-surface rounded-3xl p-5 flex flex-col overflow-y-auto max-h-[90vh]"
      >
        <DialogTitle className="sr-only">
          Detalle de {player.nombre} {player.apellido}
        </DialogTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-surface-dark text-text-muted hover:bg-black/10"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-4 mb-4">
          <Avatar p={player} size={80} />
          <div>
            <h3 className="font-black text-xl text-dark">
              {player.nombre} {player.apellido}
            </h3>
            <div className="text-sm text-text-muted">
              {getEdad(player.fechaNacimiento)} años
            </div>
          </div>
        </div>

        <div className="bg-primary text-white rounded-xl p-4 text-center mb-4">
          <div className="text-3xl font-black">{total}</div>
          <div className="text-xs font-bold opacity-70">PUNTOS TOTALES</div>
        </div>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          {details.map((d, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-white rounded-lg p-2 border border-surface-dark"
            >
              <span className="text-sm font-medium text-dark">{d.label}</span>
              <span
                className={cn(
                  "font-black text-sm",
                  d.pts >= 0 ? "text-green-600" : "text-red-500",
                )}
              >
                {d.pts >= 0 ? "+" : ""}
                {d.pts}
              </span>
            </div>
          ))}
          {details.length === 0 && (
            <div className="text-center text-text-muted text-sm py-4">
              Sin puntos registrados
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TabAsistencia({ act, db }) {
  const participants = db.participants;
  const [selectedAges, setSelectedAges] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Obtener edades únicas de los asistentes
  const availableAges = useMemo(() => {
    const ages = new Set();
    act.asistentes.forEach((pid) => {
      const p = participants.find((x) => x.id === pid);
      if (p && p.fechaNacimiento) {
        ages.add(getEdad(p.fechaNacimiento));
      }
    });
    return Array.from(ages).sort((a, b) => a - b);
  }, [act.asistentes, participants]);

  // Stats
  const stats = useMemo(() => {
    const total = act.asistentes.length;
    let males = 0;
    let females = 0;
    let puntuales = 0;

    act.asistentes.forEach((pid) => {
      const p = participants.find((x) => x.id === pid);
      if (p) {
        if (p.sexo === "M") males++;
        else if (p.sexo === "F") females++;
      }
      if (act.puntuales.includes(pid)) puntuales++;
    });

    return { total, males, females, puntuales };
  }, [act, participants]);

  // Lista de asistentes filtrados
  const filteredAsistentes = useMemo(() => {
    return act.asistentes
      .map((pid) => {
        const p = participants.find((x) => x.id === pid);
        if (!p) return null;
        return { ...p, edad: getEdad(p.fechaNacimiento) };
      })
      .filter(Boolean)
      .filter((p) => {
        if (selectedAges.length > 0 && !selectedAges.includes(p.edad)) return false;
        return true;
      })
      .sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
      );
  }, [act.asistentes, participants, selectedAges]);

  const toggleAge = (age) => {
    setSelectedAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age],
    );
  };

  const clearAges = () => setSelectedAges([]);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white/20 rounded-xl p-3 text-center border border-white/20">
          <div className="text-2xl font-black text-accent">{stats.total}</div>
          <div className="text-xs font-bold opacity-60 text-accent flex items-center justify-center gap-1">
            <Users className="w-3 h-3" />
            Total
          </div>
        </div>
        <div className="bg-white/20 rounded-xl p-3 text-center border border-white/20">
          <div className="text-2xl font-black text-accent">{stats.males}</div>
          <div className="text-xs font-bold opacity-60 text-accent">Varones</div>
        </div>
        <div className="bg-white/20 rounded-xl p-3 text-center border border-white/20">
          <div className="text-2xl font-black text-accent">{stats.females}</div>
          <div className="text-xs font-bold opacity-60 text-accent">Mujeres</div>
        </div>
        <div className="bg-white/20 rounded-xl p-3 text-center border border-white/20">
          <div className="text-2xl font-black text-accent">{stats.puntuales}</div>
          <div className="text-xs font-bold opacity-60 text-accent flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            Puntuales
          </div>
        </div>
      </div>

      {/* Filtro de edades */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={clearAges}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-bold transition-colors",
              selectedAges.length === 0
                ? "bg-accent text-dark"
                : "bg-white/20 text-white/80 hover:bg-white/30",
            )}
          >
            Todas
          </button>
          {availableAges.map((age) => (
            <button
              key={age}
              onClick={() => toggleAge(age)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-bold transition-colors",
                selectedAges.includes(age)
                  ? "bg-accent text-dark"
                  : "bg-white/20 text-white/80 hover:bg-white/30",
              )}
            >
              {age} años
            </button>
          ))}
        </div>
      </div>

      {/* Lista de asistentes */}
      {filteredAsistentes.length === 0 ? (
        <div className="text-center text-white/60 py-8">
          {act.asistentes.length === 0
            ? "No hay asistentes registrados"
            : "No hay asistentes que coincidan con los filtros"}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mujeres */}
          {filteredAsistentes.filter((p) => p.sexo === "F").length > 0 && (
            <div className="bg-accent/20 rounded-xl p-3 border border-accent/30">
              <div className="font-bold text-sm text-accent mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Mujeres ({filteredAsistentes.filter((p) => p.sexo === "F").length})
              </div>
              <div className="flex flex-col gap-1">
                {filteredAsistentes
                  .filter((p) => p.sexo === "F")
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className="bg-white rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:bg-accent/30 transition-colors"
                    >
                      <Avatar p={p} size={28} />
                      <div className="flex-1">
                        <div className="font-bold text-sm">
                          {p.nombre} {p.apellido}
                        </div>
                      </div>
                      <div className="text-xs text-accent font-medium">
                        {p.edad}a
                      </div>
                      {act.puntuales.includes(p.id) && (
                        <Clock className="w-3 h-3 text-green-400" />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Varones */}
          {filteredAsistentes.filter((p) => p.sexo === "M").length > 0 && (
            <div className="bg-white/20 rounded-xl p-3 border border-white/30">
              <div className="font-bold text-sm text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white" />
                Varones ({filteredAsistentes.filter((p) => p.sexo === "M").length})
              </div>
              <div className="flex flex-col gap-1">
                {filteredAsistentes
                  .filter((p) => p.sexo === "M")
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className="bg-white/90 rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:bg-white transition-colors"
                    >
                      <Avatar p={p} size={28} />
                      <div className="flex-1">
                        <div className="font-bold text-sm text-dark">
                          {p.nombre} {p.apellido}
                        </div>
                      </div>
                      <div className="text-xs text-white/80 font-medium">
                        {p.edad}a
                      </div>
                      {act.puntuales.includes(p.id) && (
                        <Clock className="w-3 h-3 text-green-400" />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de detalle */}
      {selectedPlayer && (
        <PlayerPointsModal
          player={selectedPlayer}
          act={act}
          participants={participants}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
