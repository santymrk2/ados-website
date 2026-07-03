"use client";

import { useState, useMemo } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";
import { getEdad } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Common";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import type { ParticipantBasic } from "@/lib/types";

export function BibliaSection() {
  const {
    activity: act,
    db,
    isAdmin,
    canEditBiblia,
    locked,
    searchQuery,
    performQuickUpdate,
  } = useUnifiedActivity();
  const [editing, setEditing] = useState(false);

  const canEdit = (isAdmin || canEditBiblia) && !locked;

  const participantsWithBiblia = useMemo(() => {
    if (!act) return [];
    return (act.biblias || [])
      .map((pid) => db.participants.find((p) => p.id === pid))
      .filter((p): p is ParticipantBasic => !!p)
      .sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(
          `${b.apellido} ${b.nombre}`,
        ),
      );
  }, [act, db.participants]);

  const sortedParticipants = useMemo(() => {
    let arr = db.participants.filter((p) =>
      act.asistentes.includes(p.id),
    );
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter((p) =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(q),
      );
    }
    arr.sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(
        `${b.apellido} ${b.nombre}`,
      ),
    );
    return arr;
  }, [db.participants, act.asistentes, searchQuery]);

  const toggle = async (id: number) => {
    const isIncluded = (act.biblias || []).includes(id);
    try {
      await performQuickUpdate("biblias", {
        participantId: id,
        value: !isIncluded,
      });
    } catch {
      // Error already handled by performQuickUpdate
    }
  };

  return (
    <div>
      {canEdit && !editing && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setEditing(true)}
            variant="ghost"
            size="sm"
            className="bg-white/20 text-white hover:bg-white/30"
          >
            Editar
          </Button>
        </div>
      )}
      {editing && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setEditing(false)}
            variant="ghost"
            size="sm"
            className="bg-white/20 text-white hover:bg-white/30"
          >
            Listo
          </Button>
        </div>
      )}

      {!editing && (
        <>
          <div className="bg-white/20 rounded-xl p-3 text-center border border-white/20 mb-5">
            <div className="text-2xl font-black text-accent">
              {participantsWithBiblia.length}
            </div>
            <div className="text-xs font-bold opacity-60 text-accent flex items-center justify-center gap-1">
              <BookOpen className="w-3 h-3" /> Trajeron Biblia
            </div>
          </div>

          {participantsWithBiblia.length === 0
            ? (
              <div className="text-center text-white/60 py-8">
                No hay participantes con biblia
              </div>
            )
            : (
              <div>
                <h3 className="font-bold text-sm text-white/70 mb-2">
                  Participantes con biblia
                </h3>
                <div className="flex flex-col gap-1">
                  {participantsWithBiblia.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white/90 rounded-lg p-2 flex items-center gap-2"
                    >
                      <Avatar p={p} size={28} />
                      <div className="flex-1">
                        <div className="font-bold text-sm text-dark">
                          {p.nombre} {p.apellido}
                        </div>
                        <div className="text-xs text-dark/60">
                          {getEdad(p.fechaNacimiento)} años
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Biblia
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </>
      )}

      {editing && (
        <>
          <h2 className="text-base font-black text-white">
            Biblia
            {searchQuery && (
              <span className="text-white/60 text-xs font-normal ml-1">
                (filtrado: {sortedParticipants.length})
              </span>
            )}
          </h2>

          {sortedParticipants.length === 0
            ? <Empty text="No hay participantes" className="text-white/60" />
            : (
              <div className="flex flex-col gap-1 mt-2">
                {sortedParticipants.map((p) => {
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
                            className={cn(
                              "font-bold text-sm",
                              bib ? "text-foreground" : "text-text-muted",
                            )}
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
                            locked &&
                              "opacity-50 cursor-not-allowed pointer-events-none",
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
        </>
      )}
    </div>
  );
}
