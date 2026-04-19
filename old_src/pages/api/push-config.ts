import { getVapidPublicKey, isWebPushConfigured } from '../../lib/web-push-server';

export async function GET() {
  return new Response(
    JSON.stringify({
      configured: isWebPushConfigured(),
      publicKey: getVapidPublicKey() || null,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
