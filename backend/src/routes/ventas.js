import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { scopedWhere } from '../lib/scopeWhere.js';

const router = express.Router();
router.use(authMiddleware);

const mapVenta = (v) => ({
  ...v,
  total: Number(v.monto_total),
  monto_total: Number(v.monto_total),
  monto_sin_iva: Number(v.monto_sin_iva || 0),
  iva_monto: Number(v.iva_monto || 0)
});

router.get('/', async (req, res) => {
  try {
    const where = { ...scopedWhere(req) };
    if (req.query.cliente_id) where.cliente_id = req.query.cliente_id;

    const ventas = await prisma.venta.findMany({
      where,
      include: { Cliente: true },
      orderBy: { fecha: 'desc' }
    });
    res.json(ventas.map(v => ({
      ...mapVenta(v),
      expand: { cliente_id: v.Cliente }
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ventas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { cliente_id, items } = req.body;
    if (!cliente_id) return res.status(400).json({ message: 'Cliente requerido' });
    if (!items || items.length === 0) return res.status(400).json({ message: 'Items requeridos' });

    for (const item of items) {
      const prod = await prisma.producto.findUnique({ where: { id: item.producto_id } });
      if (!prod) return res.status(400).json({ message: `Producto no encontrado: ${item.producto_id}` });
      if (prod.stock < item.cantidad) {
        return res.status(400).json({ message: `Stock insuficiente para ${prod.nombre}. Disponible: ${prod.stock}` });
      }
    }

    const { aplicar_iva = true } = req.body;
    const subtotalSinIva = items.reduce((sum, i) => sum + (i.cantidad * i.precio_unitario), 0);
    const ivaMonto = aplicar_iva ? parseFloat((subtotalSinIva * 0.15).toFixed(2)) : 0;
    const montoTotal = parseFloat((subtotalSinIva + ivaMonto).toFixed(2));

    const venta = await prisma.venta.create({
      data: {
        usuario_id: req.user.id,
        company_id: req.user.company_id,
        cliente_id,
        monto_sin_iva: subtotalSinIva,
        iva_monto: ivaMonto,
        monto_total: montoTotal,
        estado: 'completada',
        fecha: new Date()
      }
    });

    for (const item of items) {
      const subtotal = item.cantidad * item.precio_unitario;
      await prisma.itemVenta.create({
        data: {
          venta_id: venta.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal
        }
      });

      await prisma.producto.update({
        where: { id: item.producto_id },
        data: { stock: { decrement: item.cantidad } }
      });

      await prisma.inventarioMovimiento.create({
        data: {
          producto_id: item.producto_id,
          tipo: 'salida',
          cantidad: item.cantidad,
          motivo: `Venta #${venta.id.slice(-6).toUpperCase()}`,
          fecha: new Date()
        }
      });
    }

    await prisma.cliente.update({
      where: { id: cliente_id },
      data: { valor_venta: { increment: montoTotal } }
    }).catch(() => {});

    const ventaConCliente = await prisma.venta.findUnique({
      where: { id: venta.id },
      include: { Cliente: true }
    });

    res.status(201).json({
      ...mapVenta(ventaConCliente),
      expand: { cliente_id: ventaConCliente.Cliente }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear venta' });
  }
});

router.get('/:id/items', async (req, res) => {
  try {
    const items = await prisma.itemVenta.findMany({
      where: { venta_id: req.params.id },
      include: { Producto: true }
    });
    res.json(items.map(i => ({
      ...i,
      subtotal: Number(i.subtotal),
      precio_unitario: Number(i.precio_unitario),
      expand: { producto_id: i.Producto }
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener items' });
  }
});

router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const updated = await prisma.venta.updateMany({
      where: { id: req.params.id, company_id: req.user.company_id },
      data: { estado }
    });
    if (updated.count === 0) return res.status(404).json({ message: 'Venta no encontrada' });
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
});

export default router;
