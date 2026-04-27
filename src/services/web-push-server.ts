import webpush from "web-push";

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Generate VAPID keys once and save them:
// npx web-push generate-vapid-keys
// Then set them in your .env file

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn(
    "⚠️  Web Push VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env",
  );
} else {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export function isWebPushConfigured(): boolean {
  return !!(vapidPublicKey && vapidPrivateKey);
}

export function getVapidPublicKey(): string | undefined {
  return vapidPublicKey;
}

export async function sendPushToSubscription(
  subscription: PushSubscription,
  notification: PushNotification,
) {
  if (!isWebPushConfigured()) {
    throw new Error("Web Push not configured");
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    data: notification.data,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });

  try {
    await webpush.sendNotification(pushSubscription, payload);
    return { success: true };
  } catch (error: unknown) {
    console.error("Web Push send error:", error);
    const webPushError = error as { statusCode?: number };
    if (webPushError.statusCode === 410) {
      return {
        success: false,
        error: "Subscription expired",
        shouldDelete: true,
      };
    }
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

export async function sendPushToMultipleSubscriptions(
  subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }>,
  notification: PushNotification,
) {
  const results = await Promise.all(
    subscriptions.map((sub) =>
      sendPushToSubscription(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notification,
      ),
    ),
  );

  return {
    success: results.some((r) => r.success),
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  };
}

export async function sendBirthdayNotification(
  participantName: string,
  age: number,
  subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }>,
) {
  const title = "🎂 ¡Feliz Cumpleaños!";
  const body = `¡Feliz cumpleaños ${participantName}! ¡Ya tenes ${age} años!`;

  return sendPushToMultipleSubscriptions(subscriptions, {
    title,
    body,
    data: { type: "birthday" },
  });
}
