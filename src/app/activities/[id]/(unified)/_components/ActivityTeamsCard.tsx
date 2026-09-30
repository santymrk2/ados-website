"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { useUnifiedActivity } from "@/lib/activity-context";
import { useTeamStyles } from "@/hooks/useTeamStyles";
import { TEAMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/Common";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { TeamSettingsEditor, cleanTeamSettings } from "@/components/teams/TeamSettingsEditor";
import type { TeamDisplaySettings } from "@/lib/team-display";
import type { Activity } from "@/lib/types";

/** Names and colors of this activity's teams; empty = shared defaults from Configuración. */
export function ActivityTeamsCard() {
  const { activity, isAdmin, locked, performQuickUpdate } = useUnifiedActivity();
  const teams = useTeamStyles(activity.teamSettings);
  const activeTeams = TEAMS.slice(0, activity.cantEquipos || 4);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TeamDisplaySettings>({});
  const [saving, setSaving] = useState(false);
  const hasOverrides = !!activity.teamSettings && Object.keys(activity.teamSettings).length > 0;
  const canEdit = isAdmin && !locked;

  const save = async (next: TeamDisplaySettings) => {
    setSaving(true);
    try {
      const mutate = (act: Activity): Activity => ({
        ...act,
        teamSettings: Object.keys(next).length > 0 ? next : null,
      });
      await performQuickUpdate("team_settings", { teams: next }, "general", mutate);
      setOpen(false);
    } catch {
      // activity-context already reports the error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Equipos</Label>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setDraft(activity.teamSettings ?? {});
              setOpen(true);
            }}
          >
            <Palette className="w-4 h-4" /> Personalizar
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {activeTeams.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-bold"
            style={{ borderColor: teams.color(t), color: teams.get(t).bgDark, backgroundColor: teams.bg(t) }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teams.color(t) }} />
            {teams.name(t)}
          </span>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {hasOverrides ? "Personalizados para esta actividad" : "Usando los equipos por defecto"}
      </p>

      <DetailSheet open={open} onOpenChange={(o) => !saving && setOpen(o)} title="Equipos de esta actividad">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Lo que dejes vacío usa el valor por defecto de Configuración.
          </p>
          <TeamSettingsEditor
            teams={activeTeams}
            value={draft}
            fallback={teams.defaults}
            onChange={setDraft}
            disabled={saving}
          />
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => save(cleanTeamSettings(draft))} disabled={saving} size="lg">
              {saving ? "Guardando..." : "Guardar equipos"}
            </Button>
            {hasOverrides && (
              <Button variant="outline" onClick={() => save({})} disabled={saving}>
                Usar los equipos por defecto
              </Button>
            )}
          </div>
        </div>
      </DetailSheet>
    </div>
  );
}
