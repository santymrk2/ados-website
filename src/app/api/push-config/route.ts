import { NextRequest, NextResponse } from "next/server";
import { getVapidPublicKey, isWebPushConfigured } from "@/services/web-push-server";

export async function GET() {
  return NextResponse.json({
    configured: isWebPushConfigured(),
    publicKey: getVapidPublicKey() || null,
  });
}