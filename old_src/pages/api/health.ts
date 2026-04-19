import { db } from '../../lib/db';
import { participants } from '../../lib/schema';

export async function GET() {
  try {
    await db.select().from(participants).limit(1);
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ status: 'error', message: e.message }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}