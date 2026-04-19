import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions, participants } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, endpoint, p256dh, auth, participantId } = body;

    if (action === 'subscribe') {
      if (!endpoint || !p256dh || !auth) {
        return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 });
      }

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
        auth,
      });

      return NextResponse.json({ success: true, message: 'Subscribed successfully' });
    }

    if (action === 'unsubscribe') {
      if (!endpoint) {
        return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
      }

      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint));

      return NextResponse.json({ success: true, message: 'Unsubscribed successfully' });
    }

    if (action === 'delete_all') {
      await db.delete(pushSubscriptions);
      return NextResponse.json({ success: true, message: 'All subscriptions deleted' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}