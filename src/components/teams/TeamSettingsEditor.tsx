"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { resolveTeam, type TeamDisplaySettings } from "@/lib/team-display";

export const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4", "#3B82F6",
  "#8B5CF6", "#EC4899", "#6B7280", "#14B8A6", "#F59E0B", "#10B981",
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function getContrastColor(hex: string) {
  if (!HEX_RE.test(hex)) return "#000000";
  const n = parseInt(hex.slice(1), 16);
  const luminance = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 0xff) + 0.114 * (n & 0xff)) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/** Keeps only valid, non-empty entries so the server schema accepts it. */
export function cleanTeamSettings(value: TeamDisplaySettings): TeamDisplaySettings {
  const out: TeamDisplaySettings = {};
  for (const [team, entry] of Object.entries(value)) {
    const name = entry?.name?.trim();
    const color = entry?.color && HEX_RE.test(entry.color) ? entry.color.toUpperCase() : undefined;
    if (name || color) out[team] = { ...(name ? { name: name.slice(0, 24) } : {}), ...(color ? { color } : {}) };
  }
  return out;
}

/**
 * Edits name + color for each team.
 * `value` holds only explicit choices; `fallback` is what applies when a field is empty
 * (built-ins for the shared defaults, the shared defaults for an activity).
 */
export function TeamSettingsEditor({
  teams,
  value,
  fallback,
  onChange,
  disabled = false,
  framed = false,
}: {
  teams: string[];
  value: TeamDisplaySettings;
  fallback?: TeamDisplaySettings;
  onChange: (next: TeamDisplaySettings) => void;
  disabled?: boolean;
  /** Each team in its own rounded card (for screens that are not already inside one). */
  framed?: boolean;
}) {
  const update = (team: string, patch: { name?: string; color?: string }) =>
    onChange({ ...value, [team]: { ...value[team], ...patch } });

  return (
    <div className="space-y-4">
      {teams.map((team) => {
        const base = resolveTeam(team, fallback);
        const color = value[team]?.color && HEX_RE.test(value[team]!.color!) ? value[team]!.color! : base.color;
        const invalidHex = !!value[team]?.color && !HEX_RE.test(value[team]!.color!);
        return (
          <div
            key={team}
            className={cn(
              "flex items-start gap-3",
              framed && "rounded-3xl border border-border bg-card p-4",
            )}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm shrink-0 mt-5"
              style={{ backgroundColor: color, color: getContrastColor(color) }}
              aria-hidden
            >
              {team}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <label className="block">
                <span className="text-xs text-text-muted font-bold block mb-1">Nombre</span>
                <Input
                  value={value[team]?.name ?? ""}
                  placeholder={base.name}
                  maxLength={24}
                  disabled={disabled}
                  onChange={(e) => update(team, { name: e.target.value })}
                  className="h-9"
                />
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={disabled}
                    onClick={() => update(team, { color: preset })}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 disabled:opacity-50",
                      color.toUpperCase() === preset ? "ring-2 ring-primary ring-offset-1 border-primary" : "border-transparent",
                    )}
                    style={{ backgroundColor: preset }}
                    aria-label={`Color ${preset} para ${value[team]?.name || base.name}`}
                  />
                ))}
              </div>
              <Input
                type="text"
                value={value[team]?.color ?? ""}
                placeholder={base.color}
                disabled={disabled}
                onChange={(e) => update(team, { color: e.target.value })}
                className={cn("font-mono uppercase text-xs h-8", invalidHex && "border-red-500")}
                aria-invalid={invalidHex}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
