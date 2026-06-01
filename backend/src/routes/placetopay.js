import express from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const PLACETOPAY_URL = process.env.PLACETOPAY_URL || 'https://checkout-test.placetopay.ec';
const PLACETOPAY_LOGIN = process.env.PLACETOPAY_LOGIN;
const PLACETOPAY_SECRET_KEY = process.env.PLACETOPAY_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

function buildAuth() {
  const nonce = crypto.randomBytes(16).toString('base64');
  const seed = new Date().toISOString();
  const tranKey = crypto
    .createHash('sha256')
    .update(nonce + seed + PLACETOPAY_SECRET_KEY)
    .digest('base64');
  return { login: PLACETOPAY_LOGIN, nonce, seed, tranKey };
}

// POST /api/payments/session — crea sesión de pago en PlaceToPay y devuelve la URL
router.post('/session', authMiddleware, async (req, res) => {
  const { planId, planName, amount } = req.body;
  if (!planId || !planName || !amount) {
    return res.status(400).json({ message: 'Faltan datos del plan' });
  }
  if (!PLACETOPAY_LOGIN || !PLACETOPAY_SECRET_KEY) {
    return res.status(503).json({ message: 'Pasarela de pago no configurada aún. Contacta al administrador.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    // Referencia: CRM-{userId}-{planId}-{timestamp} — usada para recuperar el plan al verificar
    const reference = `CRM-${req.user.id}-${planId}-${Date.now()}`;

    const body = {
      auth: buildAuth(),
      payment: {
        reference,
        description: `Suscripción Plan ${planName} - CRM CypherCode`,
        amount: { currency: 'USD', total: amount },
      },
      expiration: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      returnUrl: `${FRONTEND_URL}/success`,
      ipAddress: (req.ip || '127.0.0.1').replace('::ffff:', ''),
      userAgent: req.headers['user-agent'] || 'CRM/1.0',
      buyer: {
        email: user.email,
        name: user.name || user.email,
      },
    };

    const response = await fetch(`${PLACETOPAY_URL}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.status?.status !== 'OK') {
      console.error('[placetopay] Session error:', data);
      return res.status(400).json({ message: data.status?.message || 'Error al crear sesión de pago' });
    }

    res.json({ processUrl: data.processUrl, requestId: data.requestId });
  } catch (err) {
    console.error('[placetopay] Session error:', err);
    res.status(500).json({ message: 'Error al iniciar el pago' });
  }
});

// POST /api/payments/verify/:requestId — verifica el pago y actualiza el plan si fue aprobado
router.post('/verify/:requestId', authMiddleware, async (req, res) => {
  if (!PLACETOPAY_LOGIN || !PLACETOPAY_SECRET_KEY) {
    return res.status(503).json({ message: 'Pasarela de pago no configurada' });
  }
  try {
    const response = await fetch(`${PLACETOPAY_URL}/api/session/${req.params.requestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth: buildAuth() }),
    });

    const data = await response.json();
    const status = data.status?.status; // APPROVED | PENDING | REJECTED | FAILED | EXPIRED

    // Extraer planId desde la referencia: CRM-{userId}-{planId}-{timestamp}
    const reference =
      data.request?.payment?.reference ||
      data.payment?.[0]?.reference ||
      '';
    const parts = reference.split('-');
    const planId = parts.length >= 3 ? parts[2] : null;

    if (status === 'APPROVED' && planId) {
      await prisma.company.update({
        where: { id: req.user.company_id },
        data: { plan_id: planId },
      });
      await prisma.user.update({
        where: { id: req.user.id },
        data: { plan: planId },
      });
    }

    res.json({ status, planId });
  } catch (err) {
    console.error('[placetopay] Verify error:', err);
    res.status(500).json({ message: 'Error al verificar el pago' });
  }
});

export default router;
