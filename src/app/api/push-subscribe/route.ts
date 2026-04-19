import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, p256dh, auth } = body;
    
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing subscription data" }, { status: 400 });
    }

    const existing = await db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.endpoint, endpoint),
    });

    if (existing) {
      return NextResponse.json({ message: "Already subscribed", id: existing.id });
    }

    const result = await db.insert(pushSubscriptions).values({
      endpoint,
      p256dh,
      auth,
      createdAt: new Date().toISOString(),
    }).returning({ id: pushSubscriptions.id });

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully",
      id: result[0]?.id,
    });
  } catch (error) {
    console.error("Push subscription error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));

    return NextResponse.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}