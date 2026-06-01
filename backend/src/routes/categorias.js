import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { company_id: req.user.company_id },
      orderBy: { name: 'asc' }
    });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, descripcion } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre es obligatorio' });

    const categoria = await prisma.categoria.create({
      data: { name, descripcion, company_id: req.user.company_id }
    });
    res.status(201).json(categoria);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear categoría' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.categoria.findFirst({
      where: { id: req.params.id, company_id: req.user.company_id }
    });
    if (!existing) return res.status(404).json({ message: 'Categoría no encontrada' });

    const { name, descripcion } = req.body;
    const categoria = await prisma.categoria.update({
      where: { id: req.params.id },
      data: { name, descripcion }
    });
    res.json(categoria);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar categoría' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.categoria.findFirst({
      where: { id: req.params.id, company_id: req.user.company_id }
    });
    if (!existing) return res.status(404).json({ message: 'Categoría no encontrada' });

    await prisma.categoria.delete({ where: { id: req.params.id } });
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar categoría' });
  }
});

export default router;
