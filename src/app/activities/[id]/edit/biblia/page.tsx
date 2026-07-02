"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useEditContext } from "../layout";
import { BookOpen } from "lucide-react";
import { Label, Empty } from "@/components/ui/Common";
import { getEdad } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { ParticipantBasic } from "@/lib/types";

export default function BibliaPage() {
  const { activity: act, setLocal, syncWithServer, db, locked, searchQuery, setFilterContent, setFiltersActive } = useEditContext();
  const [sortBy, setSortBy] = useState<"apellido" | "nombre">("apellido");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedAges, setSelectedAges] = useState<number[]>([]);

  // Edades disponibles de TODOS los participantes
  const availableAges = useMemo(() => {
    const ages = new Set<number>();
    db.participants
      .filter((p) => act.asistentes.includes(p.id))
      .forEach((p) => {
      if (p.fechaNacimiento) {
        const edad = getEdad(p.fechaNacimiento);
        if (edad !== null) ages.add(edad);
      }
    });
    return Array.from(ages).sort((a, b) => a - b);
  }, [db.participants, act.asistentes]);

  const toggleAge = useCallback((age: number) => {
    setSelectedAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age],
    );
  }, []);

  const clearAges = useCallback(() => setSelectedAges([]), []);

  // Proveer filtros al FloatingNav
  useEffect(() => {
    setFiltersActive(sortBy !== "apellido" || sortOrder !== "asc" || selectedAges.length > 0);
    setFilterContent(
      <div className="space-y-3">
        <div>
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
            Ordenar por
          </span>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setSortBy("apellido")}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
                sortBy === "apellido"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-foreground border-border hover:bg-surface-light",
              )}
            >
              Apellido
            </button>
            <button
              onClick={() => setSortBy("nombre")}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
                sortBy === "nombre"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-foreground border-border hover:bg-surface-light",
              )}
            >
              Nombre
            </button>
          </div>
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
            Dirección
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder("asc")}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
                sortOrder === "asc"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-foreground border-border hover:bg-surface-light",
              )}
            >
              A→Z
            </button>
            <button
              onClick={() => setSortOrder("desc")}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
                sortOrder === "desc"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-foreground border-border hover:bg-surface-light",
              )}
            >
              Z→A
            </button>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
            Filtrar por edad
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={clearAges}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border",
                selectedAges.length === 0
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-foreground border-border hover:bg-surface-light",
              )}
            >
              Todas
            </button>
            {availableAges.map((age) => (
              <button
                key={age}
                onClick={() => toggleAge(age)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border",
                  selectedAges.includes(age)
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-foreground border-border hover:bg-surface-light",
                )}
              >
                {age} años
              </button>
            ))}
          </div>
        </div>
      </div>,
    );
    return () => {
      setFilterContent(null);
      setFiltersActive(false);
    };
  }, [sortBy, sortOrder, selectedAges, availableAges, setFilterContent, setFiltersActive, toggleAge, clearAges]);

  const toggle = (id: number) => {
    const c = act.biblias || [];
    const isIncluded = c.includes(id);
    const updateFn = (prev: number[]) => {
      const arr = prev || [];
      return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
    };
    setLocal("biblias", updateFn, true);
    syncWithServer("biblias", { participantId: id, value: !isIncluded });
  };

  const sorted = useMemo<ParticipantBasic[]>(() => {
    let arr: ParticipantBasic[] = db.participants.filter((p) =>
      act.asistentes.includes(p.id),
    );

    // Filtro por búsqueda
    if (searchQuery) {
      arr = arr.filter((p) =>
        `${p.nombre} ${p.apellido}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      );
    }

    // Filtro por edad
    if (selectedAges.length > 0) {
      arr = arr.filter((p) => {
        if (!p.fechaNacimiento) return false;
        const edad = getEdad(p.fechaNacimiento);
        return edad !== null && selectedAges.includes(edad);
      });
    }

    // Orden
    arr.sort((a, b) => {
      const nameA = sortBy === "nombre" ? `${a.nombre} ${a.apellido}` : `${a.apellido} ${a.nombre}`;
      const nameB = sortBy === "nombre" ? `${b.nombre} ${b.apellido}` : `${b.apellido} ${b.nombre}`;
      const cmp = nameA.localeCompare(nameB);
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return arr;
  }, [db.participants, act.asistentes, searchQuery, selectedAges, sortBy, sortOrder]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Label style={{ margin: 0 }}>
          Biblia
          {searchQuery && (
            <span className="text-text-muted text-xs font-normal ml-1">
              (filtrado: {sorted.length})
            </span>
          )}
        </Label>
      </div>

      {sorted.length === 0 ? (
        <Empty text="No hay participantes" />
      ) : (
        <div className="flex flex-col gap-1">
          {sorted.map((p: ParticipantBasic) => {
            const bib = (act.biblias || []).includes(p.id);
            return (
              <div
                key={p.id}
                className={`rounded-2xl border bg-white ${bib ? "border-primary shadow-md shadow-primary/20" : "border-surface-dark"}`}
              >
                <div className="flex items-center p-3 gap-3">
                  <Avatar p={p} size={30} />
                  <div className="flex-1">
                    <div
                      className={cn("font-bold text-sm", bib ? "text-foreground" : "text-text-muted")}
                    >
                      {p.nombre} {p.apellido}
                    </div>
                    <div className="text-xs text-text-muted">
                      {getEdad(p.fechaNacimiento)}a
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(p.id)}
                    disabled={locked}
                    className={cn(
                      "flex items-center justify-center h-9 min-w-9 px-3 text-sm font-semibold transition-colors rounded-2xl border",
                      locked && "opacity-50 cursor-not-allowed pointer-events-none",
                      bib
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface-light text-text-muted border-surface-dark",
                    )}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
