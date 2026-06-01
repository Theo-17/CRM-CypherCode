import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { scopedWhere } from '../lib/scopeWhere.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const actividades = await prisma.actividad.findMany({
      where: scopedWhere(req),
      include: { User: { select: { name: true, email: true } } },
      orderBy: { created: 'desc' },
      take: 30
    });
    res.json(actividades.map(a => ({
      ...a,
      tipo: a.tipo_entidad,
      fecha: a.created,
      usuario_nombre: a.User?.name || a.User?.email || 'Usuario'
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener actividad' });
  }
});

export default router;
