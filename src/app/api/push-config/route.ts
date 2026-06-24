import { NextRequest, NextResponse } from "next/server";
import { getVapidPublicKey, isWebPushConfigured } from "@/services/web-push-server";
import { requireAuth } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.success) {
    return auth.error;
  }

  return NextResponse.json({
    configured: isWebPushConfigured(),
    publicKey: getVapidPublicKey() || null,
  });
}
