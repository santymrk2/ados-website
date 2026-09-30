"use client";

import { useStore } from "@nanostores/react";
import { $teamDefaults } from "@/store/appStore";
import { resolveTeam, type ResolvedTeam, type TeamDisplaySettings } from "@/lib/team-display";

/**
 * Display name + colors for a team id (E1..E6) in the context of an activity.
 * Pass the activity's teamSettings to apply its overrides; omit for shared defaults only.
 */
export function useTeamStyles(overrides?: TeamDisplaySettings | null) {
  const defaults = useStore($teamDefaults);
  const get = (team: string): ResolvedTeam => resolveTeam(team, defaults, overrides);
  return {
    get,
    name: (team: string) => get(team).name,
    short: (team: string) => get(team).short,
    color: (team: string) => get(team).color,
    bg: (team: string) => get(team).bgLight,
    defaults,
  };
}
