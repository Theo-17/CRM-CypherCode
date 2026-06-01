import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { scopedWhere } from '../lib/scopeWhere.js';

const router = express.Router();
router.use(authMiddleware);

const mapProducto = (p) => ({
  ...p,
  precio: Number(p.precio),
  costo: Number(p.costo || 0)
});

router.get('/', async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      where: scopedWhere(req),
      orderBy: { created: 'desc' }
    });
    res.json(productos.map(mapProducto));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

router.get('/movimientos', async (req, res) => {
  try {
    const movimientos = await prisma.inventarioMovimiento.findMany({
      where: {
        Producto: { company_id: req.user.company_id }
      },
      include: { Producto: true },
      orderBy: { fecha: 'desc' },
      take: 50
    });
    res.json(movimientos.map(m => ({
      ...m,
      expand: { producto_id: m.Producto }
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, precio, costo, stock, sku, categoria } = req.body;
    if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio' });

    const producto = await prisma.producto.create({
      data: {
        usuario_id: req.user.id,
        company_id: req.user.company_id,
        nombre, descripcion,
        precio: parseFloat(precio) || 0,
        costo: parseFloat(costo) || 0,
        stock: parseInt(stock) || 0,
        sku, categoria
      }
    });

    if (producto.stock > 0) {
      await prisma.inventarioMovimiento.create({
        data: {
          producto_id: producto.id,
          tipo: 'entrada',
          cantidad: producto.stock,
          motivo: 'Inventario inicial',
          fecha: new Date()
        }
      }).catch(() => {});
    }

    res.status(201).json(mapProducto(producto));
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.producto.findFirst({
      where: { id: req.params.id, company_id: req.user.company_id }
    });
    if (!existing) return res.status(404).json({ message: 'Producto no encontrado' });

    const { nombre, descripcion, precio, costo, stock, sku, categoria } = req.body;
    const newStock = parseInt(stock);
    const oldStock = existing.stock;
    const stockDiff = newStock - oldStock;

    const producto = await prisma.producto.update({
      where: { id: req.params.id },
      data: {
        nombre, descripcion,
        precio: parseFloat(precio),
        costo: parseFloat(costo) || 0,
        stock: newStock, sku, categoria
      }
    });

    if (stockDiff !== 0) {
      await prisma.inventarioMovimiento.create({
        data: {
          producto_id: producto.id,
          tipo: stockDiff > 0 ? 'entrada' : 'salida',
          cantidad: Math.abs(stockDiff),
          motivo: 'Ajuste manual',
          fecha: new Date()
        }
      }).catch(() => {});
    }

    res.json(mapProducto(producto));
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.producto.findFirst({
      where: { id: req.params.id, company_id: req.user.company_id }
    });
    if (!existing) return res.status(404).json({ message: 'Producto no encontrado' });

    await prisma.inventarioMovimiento.deleteMany({ where: { producto_id: req.params.id } });
    await prisma.producto.delete({ where: { id: req.params.id } });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
});

export default router;
