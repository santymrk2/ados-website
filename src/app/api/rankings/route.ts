import { NextRequest, NextResponse } from "next/server";
import { getRankingsCache, triggerRankingsRebuild } from "@/lib/cache";

export async function GET() {
  let rankings = getRankingsCache();
  
  if (! rankings) {
    triggerRankingsRebuild();
    return NextResponse.json({ error: "Calculando clasificaciones temporales, intente en unos segundos...", data: [] }, { status: 202 });
  }
  
  return NextResponse.json(rankings);
}