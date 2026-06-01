import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { scopedWhere } from '../lib/scopeWhere.js';

const router = express.Router();

const mapEmail = (e) => ({
  ...e,
  contenido: e.cuerpo,
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const emails = await prisma.emailEnviado.findMany({
      where: scopedWhere(req),
      include: { Cliente: true },
      orderBy: { fecha_envio: 'desc' }
    });
    res.json(emails.map(e => ({
      ...mapEmail(e),
      expand: { cliente_id: e.Cliente }
    })));
  } catch {
    res.status(500).json({ message: 'Error al obtener emails' });
  }
});

router.get('/cliente/:clienteId', authMiddleware, async (req, res) => {
  try {
    const emails = await prisma.emailEnviado.findMany({
      where: { cliente_id: req.params.clienteId, company_id: req.user.company_id },
      orderBy: { fecha_envio: 'desc' }
    });
    res.json(emails.map(mapEmail));
  } catch {
    res.status(500).json({ message: 'Error al obtener emails del cliente' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { cliente_id, plantilla_id, asunto, contenido } = req.body;
    if (!asunto) return res.status(400).json({ message: 'El asunto es obligatorio' });

    const email = await prisma.emailEnviado.create({
      data: {
        usuario_id: req.user.id,
        company_id: req.user.company_id,
        cliente_id: cliente_id || null,
        plantilla_id: plantilla_id || null,
        asunto,
        cuerpo: contenido || '',
        estado: 'pendiente',
        fecha_envio: new Date()
      }
    });

    res.status(201).json(mapEmail(email));
  } catch {
    res.status(500).json({ message: 'Error al guardar email' });
  }
});

router.patch('/:id/estado', authMiddleware, async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['pendiente', 'enviado'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }
    const email = await prisma.emailEnviado.update({
      where: { id: req.params.id },
      data: { estado }
    });
    res.json(mapEmail(email));
  } catch {
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
});

router.post('/email-tracking/:messageId', (req, res) => {
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.set('Content-Type', 'image/gif');
  res.set('Content-Length', pixel.length);
  res.end(pixel);
});

export default router;
