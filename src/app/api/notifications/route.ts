import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { participants, pushSubscriptions } from "@/lib/schema";
import { sendBirthdayNotification, isWebPushConfigured } from "@/lib/web-push-server";
import { getEdad } from "@/lib/constants";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, date: clientDate } = body;
    const isInternal = request.headers.get('x-internal-trigger') === 'true';

    if (action === 'send_birthday_notifications' || isInternal) {
      if (!isWebPushConfigured()) {
        return NextResponse.json({ error: 'Web Push not configured' }, { status: 500 });
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
        const [birthYear, birthMonth, birthDay] = p.fechaNacimiento.split('-');
        return birthMonth === month && birthDay === day;
      });

      if (birthdaysToday.length === 0) {
        return NextResponse.json({ message: 'No birthdays today', sent: 0 });
      }

      const allSubscriptions = await db.select().from(pushSubscriptions);

      if (allSubscriptions.length === 0) {
        return NextResponse.json({ message: 'No push subscriptions found', sent: 0 });
      }

      const results = await Promise.all(
        birthdaysToday.map(async (p) => {
          const age = getEdad(p.fechaNacimiento || '') || 0;
          const name = `${p.nombre} ${p.apellido}`;

          return sendBirthdayNotification(
            name,
            age,
            allSubscriptions.map((s) => ({
              endpoint: s.endpoint,
              p256dh: s.p256dh,
              auth: s.auth,
            }))
          );
        })
      );

      return NextResponse.json({
        sent: results.reduce((acc, r) => acc + r.sent, 0),
        birthdays: birthdaysToday.map((p) => ({
          name: `${p.nombre} ${p.apellido}`,
          fechaNacimiento: p.fechaNacimiento,
        })),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trigger = searchParams.get('trigger');
  const clientDate = searchParams.get('date');

  if (trigger === 'birthday') {
    if (!isWebPushConfigured()) {
      return NextResponse.json({ error: 'Web Push not configured' }, { status: 500 });
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
      const [birthYear, birthMonth, birthDay] = p.fechaNacimiento.split('-');
      return birthMonth === month && birthDay === day;
    });

    if (birthdaysToday.length === 0) {
      return NextResponse.json({ message: 'No birthdays today', sent: 0 });
    }

    const allSubscriptions = await db.select().from(pushSubscriptions);

    if (allSubscriptions.length === 0) {
      return NextResponse.json({ message: 'No push subscriptions found', sent: 0 });
    }

    const results = await Promise.all(
      birthdaysToday.map(async (p) => {
        const age = getEdad(p.fechaNacimiento || '') || 0;
        const name = `${p.nombre} ${p.apellido}`;
        return sendBirthdayNotification(
          name,
          age,
          allSubscriptions.map((s) => ({
            endpoint: s.endpoint,
            p256dh: s.p256dh,
            auth: s.auth,
          }))
        );
      })
    );

    return NextResponse.json({
      sent: results.reduce((acc, r) => acc + r.sent, 0),
      birthdays: birthdaysToday.map((p) => ({
        name: `${p.nombre} ${p.apellido}`,
        fechaNacimiento: p.fechaNacimiento,
      })),
    });
  }

  return NextResponse.json({
    configured: isWebPushConfigured(),
    usage: 'GET /api/notifications?trigger=birthday to send notifications',
  });
}