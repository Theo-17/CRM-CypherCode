import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const FEATURE_LIMITS = { gratis: 5, pro: 50, enterprise: Infinity };

router.post('/validate-feature-limit', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const plan = user?.plan || 'gratis';
    const limit = FEATURE_LIMITS[plan] ?? 5;
    const current = await prisma.cliente.count({ where: { usuario_id: userId } });
    const allowed = current < limit;
    res.json({ allowed, current, limit: limit === Infinity ? -1 : limit, plan });
  } catch (error) {
    res.status(500).json({ error: 'Error al validar límite' });
  }
});

export default router;
