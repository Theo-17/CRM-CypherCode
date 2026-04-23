import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

const mapPlantilla = (p) => ({ ...p, contenido: p.cuerpo });

router.get('/', async (req, res) => {
  try {
    const plantillas = await prisma.plantillaEmail.findMany({
      where: { usuario_id: req.user.id },
      orderBy: { created: 'desc' }
    });
    res.json(plantillas.map(mapPlantilla));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener plantillas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, asunto, contenido } = req.body;
    if (!nombre || !asunto || !contenido) {
      return res.status(400).json({ message: 'Nombre, asunto y contenido son obligatorios' });
    }
    const plantilla = await prisma.plantillaEmail.create({
      data: { usuario_id: req.user.id, nombre, asunto, cuerpo: contenido }
    });
    res.status(201).json(mapPlantilla(plantilla));
  } catch (error) {
    res.status(500).json({ message: 'Error al crear plantilla' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.plantillaEmail.findFirst({
      where: { id: req.params.id, usuario_id: req.user.id }
    });
    if (!existing) return res.status(404).json({ message: 'Plantilla no encontrada' });

    const { nombre, asunto, contenido } = req.body;
    const plantilla = await prisma.plantillaEmail.update({
      where: { id: req.params.id },
      data: { nombre, asunto, cuerpo: contenido }
    });
    res.json(mapPlantilla(plantilla));
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar plantilla' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.plantillaEmail.findFirst({
      where: { id: req.params.id, usuario_id: req.user.id }
    });
    if (!existing) return res.status(404).json({ message: 'Plantilla no encontrada' });

    await prisma.plantillaEmail.delete({ where: { id: req.params.id } });
    res.json({ message: 'Plantilla eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar plantilla' });
  }
});

export default router;
