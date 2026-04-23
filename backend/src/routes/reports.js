import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const where = isAdmin ? {} : { usuario_id: userId };

    const [clientes, tareas, ventas, usersCount] = await Promise.all([
      prisma.cliente.count({ where }),
      prisma.tarea.count({ where }),
      prisma.venta.aggregate({ where, _sum: { monto_total: true }, _count: { id: true } }),
      isAdmin ? prisma.user.count() : Promise.resolve(1),
    ]);

    res.json({
      users: usersCount,
      clientes,
      tareas,
      ventas: ventas._count.id,
      ingresoTotal: Number(ventas._sum.monto_total || 0),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/monthly', async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const whereBase = isAdmin ? {} : { usuario_id: userId };

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('es', { month: 'short' }) };
    });

    const results = await Promise.all(
      months.map(async ({ year, month, label }) => {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);
        const [clientes, tareas, ventas] = await Promise.all([
          prisma.cliente.count({ where: { ...whereBase, created: { gte: start, lt: end } } }),
          prisma.tarea.count({ where: { ...whereBase, created: { gte: start, lt: end } } }),
          prisma.venta.aggregate({
            where: { ...whereBase, created: { gte: start, lt: end } },
            _sum: { monto_total: true },
          }),
        ]);
        return { name: label, clientes, tareas, ventas: Number(ventas._sum.monto_total || 0) };
      })
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/vendedores', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo admins' });

    const vendedores = await prisma.user.findMany({ select: { id: true, name: true, email: true } });

    const stats = await Promise.all(
      vendedores.map(async (v) => {
        const [clientes, ventas] = await Promise.all([
          prisma.cliente.count({ where: { usuario_id: v.id } }),
          prisma.venta.aggregate({
            where: { usuario_id: v.id },
            _sum: { monto_total: true },
            _count: { id: true },
          }),
        ]);
        return {
          id: v.id,
          nombre: v.name || v.email,
          clientes,
          ventas: ventas._count.id,
          ingresos: Number(ventas._sum.monto_total || 0),
        };
      })
    );

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
