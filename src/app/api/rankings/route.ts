import { NextRequest, NextResponse } from "next/server";
import { getRankingsCache, triggerRankingsRebuild } from "@/lib/cache";

export async function GET(request: NextRequest) {
  let rankings = getRankingsCache();

  if (!rankings) {
    triggerRankingsRebuild();
    return NextResponse.json({
      success: false,
      error: "Calculando clasificaciones temporales, intente en unos segundos...",
      data: []
    }, { status: 202 });
  }

  // Return consistent format
  return NextResponse.json({
    success: true,
    data: rankings
  });
}