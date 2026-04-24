import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { scopedWhere } from '../lib/scopeWhere.js';

const router = Router();
router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const where = scopedWhere(req);

    const [clientes, tareas, ventas, usersCount] = await Promise.all([
      prisma.cliente.count({ where }),
      prisma.tarea.count({ where }),
      prisma.venta.aggregate({ where, _sum: { monto_total: true }, _count: { id: true } }),
      req.user.role === 'admin'
        ? prisma.user.count({ where: { company_id: req.user.company_id } })
        : Promise.resolve(1)
    ]);

    res.json({
      users: usersCount,
      clientes,
      tareas,
      ventas: ventas._count.id,
      ingresoTotal: Number(ventas._sum.monto_total || 0)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/monthly', async (req, res) => {
  try {
    const whereBase = scopedWhere(req);

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
            _sum: { monto_total: true }
          })
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

    const vendedores = await prisma.user.findMany({
      where: { company_id: req.user.company_id },
      select: { id: true, name: true, email: true, status: true }
    });

    const stats = await Promise.all(
      vendedores.map(async (v) => {
        const [clientes, ventas] = await Promise.all([
          prisma.cliente.count({ where: { usuario_id: v.id, company_id: req.user.company_id } }),
          prisma.venta.aggregate({
            where: { usuario_id: v.id, company_id: req.user.company_id },
            _sum: { monto_total: true },
            _count: { id: true }
          })
        ]);
        return {
          id: v.id,
          nombre: v.name || v.email,
          status: v.status,
          clientes,
          ventas: ventas._count.id,
          ingresos: Number(ventas._sum.monto_total || 0)
        };
      })
    );

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
