"use client";

import { useState, useMemo } from "react";
import { MotionConfig } from "framer-motion";
import { useUnifiedActivity } from "@/lib/activity-context";
import { getEdad } from "@/lib/constants";
import { toggleArrayField } from "@/lib/activity-mutates";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { GroupedList } from "@/components/ui/GroupedList";
import { CountUp, EmptyBlock, Reveal } from "@/app/_components/home-ui";
import { cn, normalizeText } from "@/lib/utils";
import { toolbarButtonClass } from "@/app/activities/[id]/(unified)/_components/ui-classes";
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
  const [saving, setSaving] = useState(false);

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
      const q = normalizeText(searchQuery);
      arr = arr.filter((p) =>
        normalizeText(`${p.nombre} ${p.apellido}`).includes(q),
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
    if (locked || saving) return;
    const isIncluded = (act.biblias || []).includes(id);
    setSaving(true);
    try {
      await performQuickUpdate(
        "biblias",
        { participantId: id, value: !isIncluded },
        undefined,
        toggleArrayField("biblias", id, !isIncluded),
      );
    } catch {
      // Error already handled by performQuickUpdate
    } finally {
      setSaving(false);
    }
  };

  const count = participantsWithBiblia.length;

  return (
    <MotionConfig reducedMotion="user">
      <div className="max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <Reveal index={0}>
            <div className="flex items-baseline gap-2">
              <CountUp
                value={count}
                className="text-5xl font-black tracking-tight text-foreground"
              />
              <span className="text-base font-bold text-muted-foreground">
                {count === 1 ? "trajo biblia" : "trajeron biblia"}
              </span>
            </div>
          </Reveal>
          {canEdit && (
            <Button
              onClick={() => setEditing((v) => !v)}
              variant="ghost"
              size="sm"
              className={toolbarButtonClass}
            >
              {editing ? "Listo" : "Editar"}
            </Button>
          )}
        </div>

        {!editing &&
          (count === 0 ? (
            <EmptyBlock text="No hay participantes con biblia" />
          ) : (
            <Reveal index={1}>
              <GroupedList>
                {participantsWithBiblia.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar p={p} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-bold leading-tight text-foreground">
                        {p.nombre} {p.apellido}
                      </div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        {getEdad(p.fechaNacimiento)} años
                      </div>
                    </div>
                    <BookOpen className="size-5 shrink-0 text-primary" />
                  </div>
                ))}
              </GroupedList>
            </Reveal>
          ))}

        {editing && (
          <>
            {searchQuery && (
              <div className="mb-2 px-1 text-sm text-muted-foreground">
                Filtrado: {sortedParticipants.length}
              </div>
            )}

            {sortedParticipants.length === 0 ? (
              <EmptyBlock text="No hay participantes" />
            ) : (
              <GroupedList>
                {sortedParticipants.map((p) => {
                  const bib = (act.biblias || []).includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-3"
                      style={bib ? { boxShadow: "inset 4px 0 0 var(--primary)" } : undefined}
                    >
                      <Avatar p={p} size={44} />
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "text-base font-bold leading-tight",
                            bib ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {p.nombre} {p.apellido}
                        </div>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          {getEdad(p.fechaNacimiento)}a
                        </div>
                      </div>
                      <button
                        onClick={() => toggle(p.id)}
                        disabled={locked || saving}
                        aria-pressed={bib}
                        aria-label={`Biblia de ${p.nombre} ${p.apellido}`}
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-full border transition-all active:scale-95",
                          (locked || saving) &&
                            "opacity-50 cursor-not-allowed pointer-events-none",
                          bib
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        <BookOpen className="size-5" />
                      </button>
                    </div>
                  );
                })}
              </GroupedList>
            )}
          </>
        )}
      </div>
    </MotionConfig>
  );
}
