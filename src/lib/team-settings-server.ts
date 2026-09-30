import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityTeamSettings, appSettings, type TeamDisplaySettings } from "@/lib/schema";

export const TEAM_DEFAULTS_KEY = "team_defaults";

// Postgres "undefined_table": the migration hasn't been applied yet in this environment
export function isMissingTable(error: unknown): boolean {
  let current: unknown = error;
  for (let i = 0; i < 4 && current; i++) {
    if (typeof current === "object" && (current as { code?: string }).code === "42P01") return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

export async function getTeamDefaults(): Promise<TeamDisplaySettings> {
  try {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, TEAM_DEFAULTS_KEY));
    return (row?.value as TeamDisplaySettings) ?? {};
  } catch (error) {
    if (isMissingTable(error)) return {};
    throw error;
  }
}

export async function saveTeamDefaults(teams: TeamDisplaySettings) {
  await db
    .insert(appSettings)
    .values({ key: TEAM_DEFAULTS_KEY, value: teams })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: teams, updatedAt: new Date() } });
}

export async function getActivityTeamSettingsMap(activityIds: number[]): Promise<Map<number, TeamDisplaySettings>> {
  const map = new Map<number, TeamDisplaySettings>();
  if (activityIds.length === 0) return map;
  try {
    const rows = await db
      .select()
      .from(activityTeamSettings)
      .where(inArray(activityTeamSettings.activityId, activityIds));
    for (const row of rows) map.set(row.activityId, row.teams);
  } catch (error) {
    if (!isMissingTable(error)) throw error;
  }
  return map;
}
