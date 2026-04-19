import { db } from '../../lib/db';
import { participants, pushSubscriptions } from '../../lib/schema';
import { sendBirthdayNotification, isWebPushConfigured } from '../../lib/web-push-server';
import { getEdad } from '../../lib/constants';

// Obtener la fecha actual en timezone Argentina usando Intl
function getArgentinaDate() {
  const now = new Date();
  // Usar Intl para obtener la fecha en Argentina (formato: DD/MM/YYYY)
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const formatted = formatter.format(now); // "09/04/2026"
  const [day, month, year] = formatted.split('/');
  
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { action, date: clientDate } = body;

    // Allow server-side internal triggering via header (for cron jobs without curl)
    const isInternal = request.headers.get('x-internal-trigger') === 'true';

    if (action === 'send_birthday_notifications' || isInternal) {
      if (!isWebPushConfigured()) {
        return new Response(JSON.stringify({ error: 'Web Push not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Usar la fecha del cliente si se provee, sino usar la fecha de Argentina
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
        return new Response(JSON.stringify({ message: 'No birthdays today', sent: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get all push subscriptions
      const allSubscriptions = await db.select().from(pushSubscriptions);

      if (allSubscriptions.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No push subscriptions found', sent: 0 }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
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

      return new Response(
        JSON.stringify({
          sent: results.reduce((acc, r) => acc + r.sent, 0),
          birthdays: birthdaysToday.map((p) => ({
            name: `${p.nombre} ${p.apellido}`,
            fechaNacimiento: p.fechaNacimiento,
          })),
        }),
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

export async function GET({ url }: { url: URL }) {
  const trigger = url.searchParams.get('trigger');
  const clientDate = url.searchParams.get('date'); // Opcional: date desde el cliente

  if (trigger === 'birthday') {
    if (!isWebPushConfigured()) {
      return new Response(JSON.stringify({ error: 'Web Push not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Usar la fecha del cliente si se provee, sino usar la fecha de Argentina
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
      return new Response(JSON.stringify({ message: 'No birthdays today', sent: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allSubscriptions = await db.select().from(pushSubscriptions);

    if (allSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push subscriptions found', sent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
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

    return new Response(
      JSON.stringify({
        sent: results.reduce((acc, r) => acc + r.sent, 0),
        birthdays: birthdaysToday.map((p) => ({
          name: `${p.nombre} ${p.apellido}`,
          fechaNacimiento: p.fechaNacimiento,
        })),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      configured: isWebPushConfigured(),
      usage: 'GET /api/notifications?trigger=birthday to send notifications',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
