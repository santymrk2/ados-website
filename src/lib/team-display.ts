/**
 * Team display resolution, shared by client and server.
 * Precedence: activity override → shared defaults (app_settings) → built-in defaults.
 * Team ids (E1..E6) are what's stored everywhere; names/colors are display-only.
 */
import type { TeamDisplaySettings } from "./schema";

export type { TeamDisplaySettings };

export const BUILTIN_TEAM_COLORS: Record<string, string> = {
  E1: "#FF6B6B",
  E2: "#4ECDC4",
  E3: "#FFD93D",
  E4: "#A78BFA",
  E5: "#FB923C",
  E6: "#2DD4BF",
};

export function builtinTeamName(team: string): string {
  const n = Number(team.replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? `Equipo ${n}` : team;
}

export interface ResolvedTeam {
  id: string;
  name: string;
  /** Up to 3 chars for compact badges: the id for default names, else the name's start */
  short: string;
  color: string;
  bgLight: string;
  bgDark: string;
}

export function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export function resolveTeam(
  team: string,
  defaults?: TeamDisplaySettings | null,
  overrides?: TeamDisplaySettings | null,
): ResolvedTeam {
  const color =
    overrides?.[team]?.color || defaults?.[team]?.color || BUILTIN_TEAM_COLORS[team] || "#94A3B8";
  const name = overrides?.[team]?.name || defaults?.[team]?.name || builtinTeamName(team);
  const short = name === builtinTeamName(team) ? team : name.slice(0, 3).toUpperCase();
  return { id: team, name, short, color, bgLight: lightenColor(color, 85), bgDark: darkenColor(color, 60) };
}
