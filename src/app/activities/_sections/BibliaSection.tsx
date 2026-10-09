"use client";

import { useState, useMemo } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";
import { getEdad } from "@/lib/constants";
import { toggleArrayField } from "@/lib/activity-mutates";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Common";
import { cn, normalizeText } from "@/lib/utils";
import { sectionTitleClass, toolbarButtonClass, statChipClass } from "@/app/activities/[id]/(unified)/_components/ui-classes";
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

  return (
    <div>
      {canEdit && !editing && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setEditing(true)}
            variant="ghost"
            size="sm"
            className={toolbarButtonClass}
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
            className={toolbarButtonClass}
          >
            Listo
          </Button>
        </div>
      )}

      {!editing && (
        <>
          <div className="flex items-center justify-center mb-5">
            <span className={`${statChipClass} text-sm font-bold`}>
              {participantsWithBiblia.length} trajeron biblia
            </span>
          </div>

          {participantsWithBiblia.length === 0
            ? (
              <div className="text-center text-muted-foreground py-8">
                No hay participantes con biblia
              </div>
            )
            : (
              <div>
                <div className="flex flex-col gap-1">
                  {participantsWithBiblia.map((p) => (
                    <div
                      key={p.id}
                      className="bg-muted/60 rounded-lg p-2 flex items-center gap-2"
                    >
                      <Avatar p={p} size={28} />
                      <div className="flex-1">
                        <div className="font-bold text-base text-foreground">
                          {p.nombre} {p.apellido}
                        </div>
                        <div className="text-sm text-foreground/60">
                          {getEdad(p.fechaNacimiento)} años
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </>
      )}

      {editing && (
        <>
          <h2 className={sectionTitleClass}>
            Biblia
            {searchQuery && (
              <span className="text-muted-foreground text-sm font-normal ml-1">
                (filtrado: {sortedParticipants.length})
              </span>
            )}
          </h2>

          {sortedParticipants.length === 0
            ? <Empty text="No hay participantes" />
            : (
              <div className="flex flex-col gap-1 mt-2">
                {sortedParticipants.map((p) => {
                  const bib = (act.biblias || []).includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`rounded-2xl border bg-white ${bib ? "border-primary shadow-md shadow-primary/20" : "border-border"}`}
                    >
                      <div className="flex items-center p-3 gap-3">
                        <Avatar p={p} size={30} />
                        <div className="flex-1">
                          <div
                            className={cn(
                              "font-bold text-base",
                              bib ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {p.nombre} {p.apellido}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getEdad(p.fechaNacimiento)}a
                          </div>
                        </div>
                        <button
                          onClick={() => toggle(p.id)}
                          disabled={locked || saving}
                          className={cn(
                            "flex items-center justify-center h-9 min-w-9 px-3 text-base font-semibold transition-colors rounded-2xl border",
                            (locked || saving) &&
                              "opacity-50 cursor-not-allowed pointer-events-none",
                            bib
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border",
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
