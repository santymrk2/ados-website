import { NextRequest, NextResponse } from "next/server";
import { getRankings } from "@/lib/cache";
import { requireAuth } from "@/lib/api-utils";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.success) {
    return auth.error;
  }

  try {
    const rankings = await getRankings();
    return NextResponse.json({
      success: true,
      data: rankings,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (e) {
    console.error('Error computing rankings:', e);
    return NextResponse.json({
      success: false,
      error: "Error calculando clasificaciones",
      data: [],
    }, { status: 500 });
  }
}