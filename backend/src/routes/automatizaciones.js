import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const toResponse = (r) => ({ ...r, condicion: r.trigger });

router.get('/', async (req, res) => {
  try {
    const rules = await prisma.automatizacion.findMany({
      where: { usuario_id: req.user.id },
      orderBy: { created: 'desc' },
    });
    res.json(rules.map(toResponse));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, trigger, accion, activa } = req.body;
    const rule = await prisma.automatizacion.create({
      data: { nombre, trigger, accion, activa: activa ?? true, usuario_id: req.user.id },
    });
    res.json(toResponse(rule));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, trigger, accion, activa } = req.body;
    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (trigger !== undefined) data.trigger = trigger;
    if (accion !== undefined) data.accion = accion;
    if (activa !== undefined) data.activa = activa;
    const rule = await prisma.automatizacion.update({ where: { id: req.params.id }, data });
    res.json(toResponse(rule));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.automatizacion.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/ejecutar', async (req, res) => {
  try {
    const rules = await prisma.automatizacion.findMany({ where: { activa: true } });
    res.json({ executed: rules.length, message: `${rules.length} automatizaciones procesadas` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
