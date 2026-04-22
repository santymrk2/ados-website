"use client";

import { useState, useMemo } from "react";
import { getEdad } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, Clock, Users } from "lucide-react";
import type { Activity, ParticipantBasic } from "@/lib/types";
import { PlayerPointsModal } from "@/components/activities/PlayerPointsModal";

interface PlayerPointsDetail {
  label: string;
  pts: number;
}



export function TabAsistencia({ act, db }) {
  const participants = db.participants;
  const [selectedAges, setSelectedAges] = useState<number[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Obtener edades únicas de los asistentes
  const availableAges = useMemo(() => {
    const ages = new Set<number>();
    act.asistentes.forEach((pid) => {
      const p = participants.find((x) => x.id === pid);
      if (p && p.fechaNacimiento) {
        const edad = getEdad(p.fechaNacimiento);
        if (edad !== null) ages.add(edad);
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
    const enriched = act.asistentes
      .map((pid) => {
        const p = participants.find((x) => x.id === pid);
        if (!p) return null;
        return { ...p, edad: getEdad(p.fechaNacimiento) };
      })
      .filter((p): p is { edad: number } & Omit<NonNullable<typeof p>, "edad"> => {
        if (!p || p.edad === null) return false;
        if (selectedAges.length > 0 && !selectedAges.includes(p.edad)) return false;
        return true;
      })
      .sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
      );
    return enriched;
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
          <div className="text-xs font-bold opacity-60 text-accent">
            Varones
          </div>
        </div>
        <div className="bg-white/20 rounded-xl p-3 text-center border border-white/20">
          <div className="text-2xl font-black text-accent">{stats.females}</div>
          <div className="text-xs font-bold opacity-60 text-accent">
            Mujeres
          </div>
        </div>
        <div className="bg-white/20 rounded-xl p-3 text-center border border-white/20">
          <div className="text-2xl font-black text-accent">
            {stats.puntuales}
          </div>
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
                Mujeres (
                {filteredAsistentes.filter((p) => p.sexo === "F").length})
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
                Varones (
                {filteredAsistentes.filter((p) => p.sexo === "M").length})
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
