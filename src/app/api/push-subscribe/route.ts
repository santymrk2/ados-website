import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { apiServerError, parseBody, requireAuth } from "@/lib/api-utils";
import { pushSubscriptionSchema, pushUnsubscribeSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.success) {
    return auth.error;
  }

  try {
    const parsed = await parseBody(request, pushSubscriptionSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const { endpoint, p256dh, auth: subscriptionAuth, participantId } = parsed.data;

    const existing = await db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.endpoint, endpoint),
    });

    if (existing) {
      return NextResponse.json({ message: "Already subscribed", id: existing.id });
    }

    const result = await db.insert(pushSubscriptions).values({
      participantId: participantId || null,
      endpoint,
      p256dh,
      auth: subscriptionAuth,
      createdAt: new Date().toISOString(),
    }).returning({ id: pushSubscriptions.id });

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully",
      id: result[0]?.id,
    });
  } catch (error) {
    console.error("Push subscription error:", error);
    return apiServerError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.success) {
    return auth.error;
  }

  try {
    const parsed = await parseBody(request, pushUnsubscribeSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, parsed.data.endpoint));

    return NextResponse.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return apiServerError(error);
  }
}
