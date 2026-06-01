import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { syncTaskToCalendar } from '../lib/googleCalendarSync.js';

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const CALENDAR_REDIRECT_URI = `${BACKEND_URL}/api/google-calendar/callback`;

// GET /api/google-calendar/auth — devuelve URL de autorización OAuth
router.get('/auth', authMiddleware, (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(400).json({ error: 'Google OAuth no configurado' });
  }
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(CALENDAR_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar')}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${req.user.id}`;
  res.json({ authUrl });
});

// GET /api/google-calendar/callback — Google redirige aquí tras autorizar
router.get('/callback', async (req, res) => {
  const { code, state: userId, error } = req.query;
  if (error || !code || !userId) {
    return res.redirect(`${FRONTEND_URL}/integrations?error=google_calendar_failed`);
  }
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: CALENDAR_REDIRECT_URI,
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description || 'Token exchange failed');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');

    const existing = await prisma.integracion.findFirst({
      where: { usuario_id: userId, proveedor: 'google_calendar' },
    });

    if (existing) {
      await prisma.integracion.update({
        where: { id: existing.id },
        data: {
          token_acceso: tokens.access_token,
          refresh_token: tokens.refresh_token || existing.refresh_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000),
          activa: true,
        },
      });
    } else {
      await prisma.integracion.create({
        data: {
          usuario_id: userId,
          company_id: user.company_id,
          proveedor: 'google_calendar',
          token_acceso: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000),
          activa: true,
        },
      });
    }

    res.redirect(`${FRONTEND_URL}/integrations?success=google_calendar`);
  } catch (err) {
    console.error('[google-calendar] Callback error:', err);
    res.redirect(`${FRONTEND_URL}/integrations?error=google_calendar_failed`);
  }
});

// GET /api/google-calendar/status — verifica si está conectado
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const integration = await prisma.integracion.findFirst({
      where: { usuario_id: req.user.id, proveedor: 'google_calendar', activa: true },
    });
    res.json({ connected: !!integration });
  } catch (err) {
    res.status(500).json({ error: 'Error al verificar estado' });
  }
});

// POST /api/google-calendar/sync — sincroniza todas las tareas existentes al calendario
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const integration = await prisma.integracion.findFirst({
      where: { usuario_id: req.user.id, proveedor: 'google_calendar', activa: true },
    });
    if (!integration) {
      return res.status(400).json({ error: 'Google Calendar no conectado' });
    }

    const tasks = await prisma.tarea.findMany({
      where: {
        usuario_id: req.user.id,
        NOT: { estado: 'Completada' },
        fecha_vencimiento: { not: null },
      },
    });

    let syncedCount = 0;
    for (const task of tasks) {
      const eventId = await syncTaskToCalendar(req.user.id, task).catch(() => null);
      if (eventId) {
        if (!task.google_calendar_event_id) {
          await prisma.tarea.update({ where: { id: task.id }, data: { google_calendar_event_id: eventId } }).catch(() => {});
        }
        syncedCount++;
      }
    }

    res.json({ synced: syncedCount, total: tasks.length });
  } catch (err) {
    console.error('[google-calendar] Sync error:', err);
    res.status(500).json({ error: 'Error al sincronizar con Google Calendar' });
  }
});

// DELETE /api/google-calendar/disconnect — desconecta la integración
router.delete('/disconnect', authMiddleware, async (req, res) => {
  try {
    await prisma.integracion.deleteMany({
      where: { usuario_id: req.user.id, proveedor: 'google_calendar' },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al desconectar' });
  }
});

export default router;
