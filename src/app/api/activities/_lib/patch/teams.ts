import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import * as schema from "@/lib/schema";
import { teamDisplaySettingsSchema } from "@/lib/validation";
import { isMissingTable } from "@/lib/team-settings-server";
import type { PatchHandler } from "./types";

// Per-activity team names/colors. Empty `teams` resets the activity to the shared defaults.
export const team_settings: PatchHandler = async ({ tx, activityId, data }) => {
  const parsed = teamDisplaySettingsSchema.safeParse((data as { teams?: unknown }).teams ?? {});
  if (!parsed.success) throw new AppError(parsed.error.issues[0]?.message ?? "Datos de equipos inválidos", 422);
  const teams = parsed.data;

  try {
    if (Object.keys(teams).length === 0) {
      await tx.delete(schema.activityTeamSettings).where(eq(schema.activityTeamSettings.activityId, activityId));
      return { teamSettings: null };
    }
    await tx
      .insert(schema.activityTeamSettings)
      .values({ activityId, teams })
      .onConflictDoUpdate({
        target: schema.activityTeamSettings.activityId,
        set: { teams, updatedAt: new Date() },
      });
    return { teamSettings: teams };
  } catch (error) {
    if (isMissingTable(error)) throw new AppError("Falta aplicar la migración de la base de datos (0002)", 503);
    throw error;
  }
};
