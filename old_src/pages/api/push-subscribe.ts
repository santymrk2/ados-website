import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { endpoint, p256dh, auth } = body;
    
    if (!endpoint || !p256dh || !auth) {
      return new Response(
        JSON.stringify({ error: "Missing subscription data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if subscription already exists
    const existing = await db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.endpoint, endpoint),
    });

    if (existing) {
      return new Response(
        JSON.stringify({ message: "Already subscribed", id: existing.id }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Insert new subscription
    const result = await db.insert(pushSubscriptions).values({
      endpoint,
      p256dh,
      auth,
      createdAt: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscribed successfully",
        id: result[0]?.insertId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Push subscription error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to subscribe" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing endpoint" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));

    return new Response(
      JSON.stringify({ success: true, message: "Unsubscribed successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to unsubscribe" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
