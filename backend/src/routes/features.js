import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

export const FEATURE_LIMITS = {
  gratis:     { clientes: 5,        usuarios: 2,        automatizaciones: false, reportes_avanzados: false },
  pro:        { clientes: 100,      usuarios: 10,       automatizaciones: true,  reportes_avanzados: true  },
  enterprise: { clientes: Infinity, usuarios: Infinity, automatizaciones: true,  reportes_avanzados: true  },
};

router.post('/validate-feature-limit', authMiddleware, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.company_id }
    });
    const plan = company?.plan_id || 'gratis';
    const limit = FEATURE_LIMITS[plan]?.clientes ?? 5;
    const current = await prisma.cliente.count({
      where: { company_id: req.user.company_id }
    });
    const allowed = limit === Infinity || current < limit;
    res.json({ allowed, current, limit: limit === Infinity ? -1 : limit, plan });
  } catch (error) {
    res.status(500).json({ error: 'Error al validar límite' });
  }
});

export default router;
