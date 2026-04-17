import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /stripe/create-checkout
router.post('/create-checkout', async (req, res) => {
  const { plan, amount, productName, successUrl, cancelUrl } = req.body;

  if (!plan || !amount || !productName || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Missing required fields: plan, amount, productName, successUrl, cancelUrl' });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: productName },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      plan,
    },
  });

  res.json({ url: session.url });
});

// GET /stripe/session/:sessionId
router.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  res.json({
    id: session.id,
    status: session.payment_status,
    amountTotal: session.amount_total,
    customerEmail: session.customer_details?.email,
    plan: session.metadata?.plan,
  });
});

// POST /stripe/webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userEmail = session.customer_details?.email;
    const plan = session.metadata?.plan;
    const stripeCustomerId = session.customer;
    const stripeSubscriptionId = session.subscription;

    if (!userEmail || !plan) {
      logger.warn('Missing email or plan in webhook event');
      return res.status(200).json({ received: true });
    }

    // Find user by email
    const users = await pb.collection('users').getFullList({
      filter: `email = "${userEmail}"`,
    });

    if (users.length === 0) {
      logger.warn(`User not found for email: ${userEmail}`);
      return res.status(200).json({ received: true });
    }

    const userId = users[0].id;
    const today = new Date();
    const fechaInicio = today.toISOString().split('T')[0];

    // Calculate renewal date based on plan
    let fechaRenovacion;
    if (plan === 'enterprise') {
      fechaRenovacion = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
    } else {
      fechaRenovacion = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    fechaRenovacion = fechaRenovacion.toISOString().split('T')[0];

    // Check if subscription already exists
    const existingSuscripciones = await pb.collection('suscripciones').getFullList({
      filter: `usuario = "${userId}"`,
    });

    if (existingSuscripciones.length > 0) {
      // Update existing subscription
      await pb.collection('suscripciones').update(existingSuscripciones[0].id, {
        plan,
        fecha_inicio: fechaInicio,
        fecha_renovacion: fechaRenovacion,
        estado_pago: 'completado',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      });
      logger.info(`Updated subscription for user ${userId}`);
    } else {
      // Create new subscription
      await pb.collection('suscripciones').create({
        usuario: userId,
        plan,
        fecha_inicio: fechaInicio,
        fecha_renovacion: fechaRenovacion,
        estado_pago: 'completado',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      });
      logger.info(`Created subscription for user ${userId}`);
    }
  }

  res.status(200).json({ received: true });
});

export default router;