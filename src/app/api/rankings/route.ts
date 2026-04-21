import { NextRequest, NextResponse } from "next/server";
import { getRankingsCache, triggerRankingsRebuild } from "@/lib/cache";

export const dynamic = 'force-dynamic';

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
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}