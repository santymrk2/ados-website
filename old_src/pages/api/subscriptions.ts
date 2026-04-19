import { db } from '../../lib/db';
import { pushSubscriptions, participants } from '../../lib/schema';
import { eq } from 'drizzle-orm';

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { action, endpoint, p256dh, auth, participantId } = body;

    if (action === 'subscribe') {
      if (!endpoint || !p256dh || !auth) {
        return new Response(
          JSON.stringify({ error: 'Missing subscription data' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if already subscribed
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint));

      if (existing.length > 0) {
        return new Response(
          JSON.stringify({ message: 'Already subscribed', success: true }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      await db.insert(pushSubscriptions).values({
        participantId: participantId || null,
        endpoint,
        p256dh,
        auth,
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Subscribed successfully' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'unsubscribe') {
      if (!endpoint) {
        return new Response(
          JSON.stringify({ error: 'Missing endpoint' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint));

      return new Response(
        JSON.stringify({ success: true, message: 'Unsubscribed successfully' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'delete_all') {
      await db.delete(pushSubscriptions);

      return new Response(
        JSON.stringify({ success: true, message: 'All subscriptions deleted' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
