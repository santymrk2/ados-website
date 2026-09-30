import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import * as schema from "@/lib/schema";
import { isActiveTeam } from "../helpers";
import type { Tx } from "../types";

export async function assertTeamEnabled(tx: Tx, activityId: number, team: string) {
  const [activity] = await tx
    .select({ cantEquipos: schema.activities.cantEquipos })
    .from(schema.activities)
    .where(eq(schema.activities.id, activityId));

  if (!activity || !isActiveTeam(team, activity.cantEquipos)) {
    throw new AppError("Equipo no habilitado para esta actividad");
  }
}
