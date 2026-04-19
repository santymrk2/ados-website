import { NextRequest, NextResponse } from "next/server";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/web-push-server";

export async function GET() {
  return NextResponse.json({
    configured: isWebPushConfigured(),
    publicKey: getVapidPublicKey() || null,
  });
}