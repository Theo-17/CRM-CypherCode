import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { scopedWhere } from '../lib/scopeWhere.js';

const router = express.Router();
router.use(authMiddleware);

const logActivity = (req, accion, descripcion, entidadId) =>
  prisma.actividad.create({
    data: {
      usuario_id: req.user.id,
      company_id: req.user.company_id,
      tipo_entidad: 'tarea',
      entidad_id: entidadId,
      accion,
      descripcion
    }
  }).catch(() => {});

router.get('/', async (req, res) => {
  try {
    const tareas = await prisma.tarea.findMany({
      where: scopedWhere(req),
      orderBy: { created: 'desc' }
    });
    res.json(tareas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas' });
  }
});

router.get('/cliente/:clienteId', async (req, res) => {
  try {
    const tareas = await prisma.tarea.findMany({
      where: { cliente_id: req.params.clienteId, company_id: req.user.company_id },
      orderBy: { created: 'desc' }
    });
    res.json(tareas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas del cliente' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { titulo, descripcion, cliente_id, fecha_vencimiento, prioridad, estado, reminders } = req.body;
    if (!titulo) return res.status(400).json({ message: 'El título es obligatorio' });

    const tarea = await prisma.tarea.create({
      data: {
        usuario_id: req.user.id,
        company_id: req.user.company_id,
        cliente_id: cliente_id || null,
        titulo, descripcion,
        estado: estado || 'Pendiente',
        prioridad: prioridad || 'Media',
        fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : null
      }
    });

    if (reminders && fecha_vencimiento && Array.isArray(reminders)) {
      const due = new Date(fecha_vencimiento);
      for (const minutes of reminders) {
        const fechaRecordatorio = new Date(due.getTime() - minutes * 60 * 1000);
        if (fechaRecordatorio > new Date()) {
          await prisma.recordatorio.create({
            data: {
              usuario_id: req.user.id,
              tarea_id: tarea.id,
              fecha_recordatorio: fechaRecordatorio,
              enviado: false
            }
          }).catch(() => {});
        }
      }
    }

    logActivity(req, 'crear', `Tarea "${titulo}" creada`, tarea.id);
    res.status(201).json(tarea);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear tarea' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.tarea.findFirst({
      where: { id: req.params.id, company_id: req.user.company_id }
    });
    if (!existing) return res.status(404).json({ message: 'Tarea no encontrada' });

    const { titulo, descripcion, cliente_id, fecha_vencimiento, prioridad, estado } = req.body;
    const tarea = await prisma.tarea.update({
      where: { id: req.params.id },
      data: {
        titulo, descripcion,
        cliente_id: cliente_id || null,
        estado, prioridad,
        fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : null
      }
    });

    logActivity(req, 'actualizar', `Tarea "${tarea.titulo}" actualizada`, tarea.id);
    res.json(tarea);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar tarea' });
  }
});

router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const tarea = await prisma.tarea.updateMany({
      where: { id: req.params.id, company_id: req.user.company_id },
      data: { estado }
    });
    if (tarea.count === 0) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.tarea.findFirst({
      where: { id: req.params.id, company_id: req.user.company_id }
    });
    if (!existing) return res.status(404).json({ message: 'Tarea no encontrada' });

    await prisma.recordatorio.deleteMany({ where: { tarea_id: req.params.id } });
    await prisma.tarea.delete({ where: { id: req.params.id } });
    logActivity(req, 'eliminar', `Tarea "${existing.titulo}" eliminada`, req.params.id);
    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar tarea' });
  }
});

export default router;
