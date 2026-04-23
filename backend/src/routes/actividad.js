import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const actividades = await prisma.actividad.findMany({
      where: { usuario_id: req.user.id },
      orderBy: { created: 'desc' },
      take: 30
    });
    res.json(actividades.map(a => ({
      ...a,
      tipo: a.tipo_entidad,
      fecha: a.created
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener actividad' });
  }
});

export default router;
