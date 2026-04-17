import 'dotenv/config';
import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /slack/send-message
router.post('/send-message', async (req, res) => {
  const { webhookUrl, message, channel } = req.body;

  if (!webhookUrl || !message) {
    return res.status(400).json({ error: 'webhookUrl and message are required' });
  }

  const payload = {
    text: message,
    ...(channel && { channel }),
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook error: ${response.status} ${response.statusText}`);
  }

  const result = await response.text();

  logger.info(`Message sent to Slack: ${message}`);
  res.json({ success: true, message: 'Message sent to Slack' });
});

// POST /slack/send-rich-message
router.post('/send-rich-message', async (req, res) => {
  const { webhookUrl, blocks, text } = req.body;

  if (!webhookUrl || (!blocks && !text)) {
    return res.status(400).json({ error: 'webhookUrl and either blocks or text are required' });
  }

  const payload = {};
  if (blocks) {
    payload.blocks = blocks;
  }
  if (text) {
    payload.text = text;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook error: ${response.status} ${response.statusText}`);
  }

  await response.text();

  logger.info('Rich message sent to Slack');
  res.json({ success: true, message: 'Rich message sent to Slack' });
});

export default router;