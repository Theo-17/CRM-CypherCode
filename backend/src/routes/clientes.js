import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { scopedWhere } from '../lib/scopeWhere.js';
import { FEATURE_LIMITS } from './features.js';

const router = express.Router();
router.use(authMiddleware);

const logActivity = (req, accion, descripcion, entidadId) =>
  prisma.actividad.create({
    data: {
      usuario_id: req.user.id,
      company_id: req.user.company_id,
      tipo_entidad: 'cliente',
      entidad_id: entidadId,
      accion,
      descripcion
    }
  }).catch(() => {});

router.get('/', async (req, res) => {
  try {
    const { q, estado } = req.query;
    const where = { ...scopedWhere(req) };
    if (estado && estado !== 'all') where.estado = estado;
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { empresa: { contains: q, mode: 'insensitive' } }
      ];
    }
    const clientes = await prisma.cliente.findMany({ where, orderBy: { created: 'desc' } });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: req.params.id, company_id: req.user.company_id }
    });
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener cliente' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, email, telefono, empresa, estado, estado_conversion, valor_venta, motivo_perdida, notas } = req.body;
    if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio' });

    const company = await prisma.company.findUnique({ where: { id: req.user.company_id } });
    const plan = company?.plan_id || 'gratis';
    const clienteLimit = FEATURE_LIMITS[plan]?.clientes ?? 5;
    if (clienteLimit !== Infinity) {
      const count = await prisma.cliente.count({ where: { company_id: req.user.company_id } });
      if (count >= clienteLimit) {
        return res.status(403).json({ message: `Límite de ${clienteLimit} clientes alcanzado para el plan ${plan}. Actualiza tu suscripción.` });
      }
    }

    const cliente = await prisma.cliente.create({
      data: {
        usuario_id: req.user.id,
        company_id: req.user.company_id,
        nombre, email, telefono, empresa,
        estado: estado || 'Activo',
        estado_conversion: estado_conversion || 'prospecto',
        valor_venta: valor_venta ? parseFloat(valor_venta) : null,
        motivo_perdida, notas
      }
    });

    logActivity(req, 'crear', `Cliente "${nombre}" creado`, cliente.id);
    res.status(201).json(cliente);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear cliente' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.cliente.findFirst({
      where: { id: req.params.id, company_id: req.user.company_id }
    });
    if (!existing) return res.status(404).json({ message: 'Cliente no encontrado' });

    const { nombre, email, telefono, empresa, estado, estado_conversion, valor_venta, motivo_perdida, notas } = req.body;
    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: {
        nombre, email, telefono, empresa, estado, estado_conversion,
        valor_venta: valor_venta !== undefined ? parseFloat(valor_venta) : undefined,
        motivo_perdida, notas
      }
    });

    logActivity(req, 'actualizar', `Cliente "${cliente.nombre}" actualizado`, cliente.id);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.cliente.findFirst({
      where: { id: req.params.id, company_id: req.user.company_id }
    });
    if (!existing) return res.status(404).json({ message: 'Cliente no encontrado' });

    await prisma.cliente.delete({ where: { id: req.params.id } });
    logActivity(req, 'eliminar', `Cliente "${existing.nombre}" eliminado`, req.params.id);
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar cliente' });
  }
});

export default router;
