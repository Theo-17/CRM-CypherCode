import prisma from './prisma.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

async function getAccessToken(userId) {
  const integration = await prisma.integracion.findFirst({
    where: { usuario_id: userId, proveedor: 'google_calendar', activa: true },
  });
  if (!integration) return null;

  if (!integration.token_expiry || new Date(integration.token_expiry) > new Date()) {
    return integration.token_acceso;
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const tokens = await res.json();
    if (!res.ok) return null;
    await prisma.integracion.update({
      where: { id: integration.id },
      data: {
        token_acceso: tokens.access_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
    return tokens.access_token;
  } catch {
    return null;
  }
}

// Crea o actualiza un evento de Google Calendar para la tarea.
// Devuelve el event ID de Google, o null si el usuario no tiene Google Calendar conectado.
export async function syncTaskToCalendar(userId, task) {
  if (!task.fecha_vencimiento) return null;
  try {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) return null;

    const dateStr = new Date(task.fecha_vencimiento).toISOString().split('T')[0];
    const eventData = {
      summary: task.titulo,
      description: task.descripcion || '',
      start: { date: dateStr },
      end: { date: dateStr },
    };

    let response;
    if (task.google_calendar_event_id) {
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.google_calendar_event_id}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        }
      );
    } else {
      response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        }
      );
    }

    if (response.ok) {
      const event = await response.json();
      return event.id;
    }
    return task.google_calendar_event_id || null;
  } catch {
    return null;
  }
}

// Elimina el evento de Google Calendar asociado a la tarea (si existe).
export async function deleteTaskFromCalendar(userId, googleEventId) {
  if (!googleEventId) return;
  try {
    const accessToken = await getAccessToken(userId);
    if (!accessToken) return;
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch {}
}
