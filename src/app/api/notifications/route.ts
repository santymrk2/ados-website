import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { participants, pushSubscriptions } from "@/lib/schema";
import { sendBirthdayNotification, isWebPushConfigured, type PushMultiResult } from "@/services/web-push-server";
import { getEdad } from "@/lib/constants";
import { inArray } from "drizzle-orm";
import { apiServerError, parseBody, requireAdmin, requireAuth } from "@/lib/api-utils";
import { notificationTriggerSchema } from "@/lib/validation";
import { timingSafeEqual } from "crypto";

function getArgentinaDate() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const formatted = formatter.format(now);
  const [day, month, year] = formatted.split('/');

  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

async function sendBirthdayNotifications(clientDate: string | null = null) {
  if (!isWebPushConfigured()) {
    return { error: 'Web Push not configured', status: 500 };
  }

  let today: Date;
  if (clientDate) {
    const [y, m, d] = clientDate.split('-').map(Number);
    today = new Date(y, m - 1, d);
  } else {
    today = getArgentinaDate();
  }
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).toString().padStart(2, '0');

  const allParticipants = await db.select().from(participants);

  const birthdaysToday = allParticipants.filter((p) => {
    if (!p.fechaNacimiento) return false;
    const [, birthMonth, birthDay] = p.fechaNacimiento.split('-');
    return birthMonth === month && birthDay === day;
  });

  if (birthdaysToday.length === 0) {
    return { message: 'No birthdays today', sent: 0, status: 200 };
  }

  const allSubscriptions = await db.select().from(pushSubscriptions);

  if (allSubscriptions.length === 0) {
    return { message: 'No push subscriptions found', sent: 0, status: 200 };
  }

  const subscriptionData = allSubscriptions.map((s) => ({
    endpoint: s.endpoint,
    p256dh: s.p256dh,
    auth: s.auth,
  }));

  const results: PushMultiResult[] = await Promise.all(
    birthdaysToday.map(async (p) => {
      const age = getEdad(p.fechaNacimiento || '') || 0;
      const name = `${p.nombre} ${p.apellido}`;
      return sendBirthdayNotification(name, age, subscriptionData);
    })
  );

  const allExpired = results.flatMap(r => r.expiredEndpoints);
  if (allExpired.length > 0) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, allExpired));
  }

  return {
    sent: results.reduce((acc, r) => acc + r.sent, 0),
    expired: allExpired.length,
    birthdays: birthdaysToday.map((p) => ({
      name: `${p.nombre} ${p.apellido}`,
      fechaNacimiento: p.fechaNacimiento,
    })),
    status: 200,
  };
}

function hasValidCronSecret(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");

  if (!secret || !provided) return false;

  const secretBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);

  return (
    secretBuffer.length === providedBuffer.length &&
    timingSafeEqual(secretBuffer, providedBuffer)
  );
}

export async function POST(request: NextRequest) {
  const isInternal = hasValidCronSecret(request);
  if (!isInternal) {
    const auth = requireAdmin(request);
    if (!auth.success) {
      return auth.error;
    }
  }

  try {
    const parsed = await parseBody(request, notificationTriggerSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const result = await sendBirthdayNotifications(parsed.data.date ?? null);
    return NextResponse.json(result, { status: result.status });
  } catch (e) {
    return apiServerError(e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trigger = searchParams.get('trigger');
    const clientDate = searchParams.get('date');

    if (trigger === 'birthday') {
      const isInternal = hasValidCronSecret(request);
      if (!isInternal) {
        const auth = requireAdmin(request);
        if (!auth.success) {
          return auth.error;
        }
      }

      if (clientDate && !/^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
        return NextResponse.json({ error: 'Invalid date' }, { status: 422 });
      }

      const result = await sendBirthdayNotifications(clientDate);
      return NextResponse.json(result, { status: result.status });
    }

    const auth = requireAuth(request);
    if (!auth.success) {
      return auth.error;
    }

    return NextResponse.json({
      configured: isWebPushConfigured(),
    });
  } catch (e) {
    return apiServerError(e);
  }
}
