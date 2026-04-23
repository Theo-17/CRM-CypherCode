import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

const userResponse = (u) => ({
  id: u.id, email: u.email, name: u.name,
  role: u.role, rol: u.role,
  plan: u.plan || 'gratis',
  created: u.created
});

router.get('/', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
  try {
    const users = await prisma.user.findMany({ orderBy: { created: 'desc' } });
    res.json(users.map(userResponse));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

export default router;
