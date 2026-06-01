import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ clientes: [], tareas: [], seguimientos: [] });

    const isAdmin = req.user.role === 'admin';
    const whereBase = isAdmin
      ? { company_id: req.user.company_id }
      : { company_id: req.user.company_id, usuario_id: req.user.id };

    const [clientes, tareas, seguimientos] = await Promise.all([
      prisma.cliente.findMany({
        where: {
          ...whereBase,
          OR: [
            { nombre: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { empresa: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      prisma.tarea.findMany({
        where: {
          ...whereBase,
          OR: [
            { titulo: { contains: q, mode: 'insensitive' } },
            { descripcion: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      prisma.seguimiento.findMany({
        where: {
          ...whereBase,
          notas: { contains: q, mode: 'insensitive' },
        },
        include: { Cliente: { select: { nombre: true } } },
        take: 10,
      }),
    ]);

    res.json({ clientes, tareas, seguimientos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
