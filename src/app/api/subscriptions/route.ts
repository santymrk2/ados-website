import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { apiServerError, parseBody, requireAdmin } from "@/lib/api-utils";
import { subscriptionActionSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.success) {
    return auth.error;
  }

  try {
    const parsed = await parseBody(request, subscriptionActionSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const body = parsed.data;

    if (body.action === 'subscribe') {
      const { endpoint, p256dh, auth: subscriptionAuth, participantId } = body;

      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint));

      if (existing.length > 0) {
        return NextResponse.json({ message: 'Already subscribed', success: true });
      }

      await db.insert(pushSubscriptions).values({
        participantId: participantId || null,
        endpoint,
        p256dh,
        auth: subscriptionAuth,
      });

      return NextResponse.json({ success: true, message: 'Subscribed successfully' });
    }

    if (body.action === 'unsubscribe') {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, body.endpoint));

      return NextResponse.json({ success: true, message: 'Unsubscribed successfully' });
    }

    if (body.action === 'delete_all') {
      await db.delete(pushSubscriptions);
      return NextResponse.json({ success: true, message: 'All subscriptions deleted' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return apiServerError(e);
  }
}
