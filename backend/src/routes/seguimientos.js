import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

const logActivity = (userId, accion, descripcion, entidadId) =>
  prisma.actividad.create({
    data: { usuario_id: userId, tipo_entidad: 'seguimiento', entidad_id: entidadId, accion, descripcion }
  }).catch(() => {});

router.get('/', async (req, res) => {
  try {
    const seguimientos = await prisma.seguimiento.findMany({
      where: { usuario_id: req.user.id },
      orderBy: { fecha: 'desc' }
    });
    res.json(seguimientos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener seguimientos' });
  }
});

router.get('/cliente/:clienteId', async (req, res) => {
  try {
    const seguimientos = await prisma.seguimiento.findMany({
      where: { cliente_id: req.params.clienteId },
      orderBy: { fecha: 'desc' }
    });
    res.json(seguimientos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener seguimientos del cliente' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { cliente_id, tipo, fecha, notas } = req.body;
    if (!cliente_id || !fecha) return res.status(400).json({ message: 'Cliente y fecha son obligatorios' });

    const seguimiento = await prisma.seguimiento.create({
      data: {
        usuario_id: req.user.id,
        cliente_id, tipo,
        fecha: new Date(fecha),
        notas
      }
    });

    logActivity(req.user.id, 'crear', `Seguimiento "${tipo}" registrado`, seguimiento.id);
    res.status(201).json(seguimiento);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear seguimiento' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.seguimiento.findFirst({
      where: { id: req.params.id, usuario_id: req.user.id }
    });
    if (!existing) return res.status(404).json({ message: 'Seguimiento no encontrado' });

    const { cliente_id, tipo, fecha, notas } = req.body;
    const seguimiento = await prisma.seguimiento.update({
      where: { id: req.params.id },
      data: { cliente_id, tipo, fecha: fecha ? new Date(fecha) : undefined, notas }
    });

    res.json(seguimiento);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar seguimiento' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.seguimiento.findFirst({
      where: { id: req.params.id, usuario_id: req.user.id }
    });
    if (!existing) return res.status(404).json({ message: 'Seguimiento no encontrado' });

    await prisma.seguimiento.delete({ where: { id: req.params.id } });
    res.json({ message: 'Seguimiento eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar seguimiento' });
  }
});

export default router;
