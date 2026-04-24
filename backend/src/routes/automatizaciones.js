import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { scopedWhere } from '../lib/scopeWhere.js';

const router = Router();
router.use(authMiddleware);

const toResponse = (r) => ({ ...r, condicion: r.trigger });

const PREDEFINED_TEMPLATES = [
  { id: 'cliente_sin_seguimiento_30d', nombre: 'Cliente sin seguimiento 30 días',
    trigger: 'cliente_sin_seguimiento_30d', accion: 'crear_notificacion_seguimiento_pendiente',
    descripcion: 'Notifica cuando un cliente lleva 30 días sin seguimiento' },
  { id: 'tarea_vencida', nombre: 'Tarea vencida',
    trigger: 'tarea_vencida', accion: 'crear_notificacion_tarea_vencida',
    descripcion: 'Notifica cuando una tarea pasa su fecha de vencimiento' },
  { id: 'cliente_nuevo', nombre: 'Cliente nuevo',
    trigger: 'cliente_nuevo', accion: 'crear_tarea_bienvenida',
    descripcion: 'Crea una tarea de bienvenida al añadir un cliente' },
  { id: 'cliente_ganado', nombre: 'Cliente ganado',
    trigger: 'cliente_ganado', accion: 'crear_notificacion_equipo',
    descripcion: 'Notifica al equipo cuando se gana un cliente' },
];

router.get('/plantillas', async (req, res) => {
  try {
    const active = await prisma.automatizacion.findMany({ where: scopedWhere(req), select: { trigger: true } });
    const activeTriggers = new Set(active.map(a => a.trigger));
    res.json(PREDEFINED_TEMPLATES.filter(t => !activeTriggers.has(t.trigger)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const rules = await prisma.automatizacion.findMany({
      where: scopedWhere(req),
      orderBy: { created: 'desc' }
    });
    res.json(rules.map(toResponse));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const template = PREDEFINED_TEMPLATES.find(t => t.id === req.body.templateId);
    if (!template) return res.status(400).json({ message: 'Plantilla no válida' });
    const existing = await prisma.automatizacion.findFirst({
      where: { trigger: template.trigger, company_id: req.user.company_id }
    });
    if (existing) return res.status(400).json({ message: 'Esta automatización ya está activa' });
    const rule = await prisma.automatizacion.create({
      data: {
        nombre: template.nombre, trigger: template.trigger, accion: template.accion,
        activa: true, usuario_id: req.user.id, company_id: req.user.company_id
      }
    });
    res.json(toResponse(rule));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.automatizacion.findFirst({
      where: { id: req.params.id, company_id: req.user.company_id }
    });
    if (!existing) return res.status(404).json({ message: 'Automatización no encontrada' });

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
    const existing = await prisma.automatizacion.findFirst({
      where: { id: req.params.id, company_id: req.user.company_id }
    });
    if (!existing) return res.status(404).json({ message: 'Automatización no encontrada' });
    await prisma.automatizacion.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/ejecutar', async (req, res) => {
  try {
    const rules = await prisma.automatizacion.findMany({
      where: { activa: true, company_id: req.user.company_id }
    });
    res.json({ executed: rules.length, message: `${rules.length} automatizaciones procesadas` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
