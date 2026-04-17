import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/hcgi/api/google-calendar/callback';

// GET /google-calendar/auth
router.get('/auth', async (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(400).json({ error: 'Google OAuth credentials not configured' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // Generate authorization URL
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&state=${userId}`;

  logger.info(`Generated Google Calendar auth URL for user ${userId}`);
  res.json({ authUrl });
});

// GET /google-calendar/callback
router.get('/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing code or userId' });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokens = await tokenResponse.json();

    // Store credentials in integraciones collection
    const integraciones = await pb.collection('integraciones').getFullList({
      filter: `usuario = "${userId}" && tipo = "google_calendar"`,
    });

    if (integraciones.length > 0) {
      // Update existing
      await pb.collection('integraciones').update(integraciones[0].id, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || integraciones[0].refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      });
    } else {
      // Create new
      await pb.collection('integraciones').create({
        usuario: userId,
        tipo: 'google_calendar',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      });
    }

    logger.info(`Stored Google Calendar credentials for user ${userId}`);
    res.json({ success: true, message: 'Google Calendar connected successfully' });
  } catch (error) {
    logger.error('Error in Google Calendar callback:', error);
    throw error;
  }
});

// POST /google-calendar/sync
router.post('/sync', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Get user's Google Calendar credentials
    const integraciones = await pb.collection('integraciones').getFullList({
      filter: `usuario = "${userId}" && tipo = "google_calendar"`,
    });

    if (integraciones.length === 0) {
      return res.status(400).json({ error: 'Google Calendar not connected for this user' });
    }

    const integration = integraciones[0];
    let accessToken = integration.access_token;

    // Check if token is expired and refresh if needed
    if (new Date(integration.token_expiry) < new Date()) {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh Google Calendar token');
      }

      const newTokens = await refreshResponse.json();
      accessToken = newTokens.access_token;

      // Update stored token
      await pb.collection('integraciones').update(integration.id, {
        access_token: accessToken,
        token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      });
    }

    // Fetch user's tasks
    const tasks = await pb.collection('tareas').getFullList({
      filter: `usuario = "${userId}" && estado != "completada"`,
    });

    let syncedCount = 0;

    // Sync each task to Google Calendar
    for (const task of tasks) {
      const eventData = {
        summary: task.titulo,
        description: task.descripcion || '',
        start: {
          date: task.fecha_vencimiento,
        },
        end: {
          date: task.fecha_vencimiento,
        },
      };

      try {
        const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (calendarResponse.ok) {
          const event = await calendarResponse.json();
          // Store Google Calendar event ID in task
          await pb.collection('tareas').update(task.id, {
            google_calendar_event_id: event.id,
          });
          syncedCount++;
        }
      } catch (error) {
        logger.warn(`Failed to sync task ${task.id} to Google Calendar:`, error);
      }
    }

    logger.info(`Synced ${syncedCount} tasks to Google Calendar for user ${userId}`);
    res.json({ synced: syncedCount });
  } catch (error) {
    logger.error('Error syncing to Google Calendar:', error);
    throw error;
  }
});

export default router;