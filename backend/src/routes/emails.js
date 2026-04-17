import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /send-email
router.post('/send-email', async (req, res) => {
  const { clienteId, templateId, asunto, contenido, destinatario } = req.body;

  if (!clienteId || !templateId || !asunto || !contenido || !destinatario) {
    return res.status(400).json({ error: 'Missing required fields: clienteId, templateId, asunto, contenido, destinatario' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(destinatario)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Use PocketBase built-in mailer via admin API
  // Note: PocketBase handles email sending through its built-in mailer
  // We'll log the email record and rely on PocketBase hooks for actual sending
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const emailRecord = await pb.collection('emails_enviados').create({
    cliente: clienteId,
    template: templateId,
    asunto,
    contenido,
    destinatario,
    abierto: false,
    message_id: messageId,
    fecha_envio: new Date().toISOString(),
  });

  logger.info(`Email logged with messageId: ${messageId} for cliente: ${clienteId}`);

  res.json({
    success: true,
    messageId,
    recordId: emailRecord.id,
  });
});

// POST /email-tracking/:messageId
router.post('/email-tracking/:messageId', async (req, res) => {
  const { messageId } = req.params;

  if (!messageId) {
    return res.status(400).json({ error: 'messageId is required' });
  }

  // Find email record by message_id
  const emails = await pb.collection('emails_enviados').getFullList({
    filter: `message_id = "${messageId}"`,
  });

  if (emails.length > 0) {
    // Mark as opened
    await pb.collection('emails_enviados').update(emails[0].id, {
      abierto: true,
      fecha_apertura: new Date().toISOString(),
    });
    logger.info(`Email opened: ${messageId}`);
  } else {
    logger.warn(`Email not found for tracking: ${messageId}`);
  }

  // Return 1x1 transparent GIF pixel
  const gifBuffer = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
    0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
    0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x0a,
    0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
    0x01, 0x00, 0x3b,
  ]);

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Content-Length', gifBuffer.length);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(gifBuffer);
});

export default router;