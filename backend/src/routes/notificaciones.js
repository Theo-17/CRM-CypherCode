import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const notificaciones = await prisma.notificacion.findMany({
      where: { usuario_id: req.user.id, leida: false },
      orderBy: { created: 'desc' }
    });
    res.json(notificaciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
});

router.put('/:id/leer', async (req, res) => {
  try {
    await prisma.notificacion.updateMany({
      where: { id: req.params.id, usuario_id: req.user.id },
      data: { leida: true }
    });
    res.json({ message: 'Marcada como leída' });
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar notificación' });
  }
});

router.put('/leer-todas', async (req, res) => {
  try {
    await prisma.notificacion.updateMany({
      where: { usuario_id: req.user.id, leida: false },
      data: { leida: true }
    });
    res.json({ message: 'Todas marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar notificaciones' });
  }
});

export default router;
