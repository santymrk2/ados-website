import { NextRequest, NextResponse } from "next/server";
import { handleApiError, parseBody, requireAdmin, requireAuth } from "@/lib/api-utils";
import { eventBus } from "@/lib/eventBus";
import { teamDefaultsUpdateSchema } from "@/lib/validation";
import { getTeamDefaults, isMissingTable, saveTeamDefaults } from "@/lib/team-settings-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.success) return auth.error;

  try {
    const teams = await getTeamDefaults();
    return NextResponse.json({ success: true, data: teams }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.success) return auth.error;

  try {
    const parsed = await parseBody(request, teamDefaultsUpdateSchema);
    if (!parsed.success) return parsed.error;

    await saveTeamDefaults(parsed.data.teams);
    eventBus.emit("data-changed");
    return NextResponse.json({ success: true, data: parsed.data.teams });
  } catch (e) {
    if (isMissingTable(e)) {
      return NextResponse.json(
        { success: false, error: "Falta aplicar la migración de la base de datos (0002)" },
        { status: 503 },
      );
    }
    return handleApiError(e);
  }
}
