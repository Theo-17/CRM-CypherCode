import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { scopedWhere } from '../lib/scopeWhere.js';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const router = express.Router();

const mapEmail = (e) => ({
  ...e,
  contenido: e.cuerpo,
  abierto: e.estado !== 'enviado'
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
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener emails del cliente' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { cliente_id, plantilla_id, asunto, contenido } = req.body;
    if (!asunto) return res.status(400).json({ message: 'El asunto es obligatorio' });

    let realSent = false;
    if (resend && cliente_id) {
      try {
        const cliente = await prisma.cliente.findUnique({ where: { id: cliente_id } });
        if (cliente?.email) {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'CRM <noreply@resend.dev>',
            to: [cliente.email],
            subject: asunto,
            html: `<div style="font-family:sans-serif">${(contenido || '').replace(/\n/g, '<br>')}</div>`
          });
          realSent = true;
        }
      } catch (sendErr) {
        console.error('Resend error:', sendErr.message);
      }
    }

    const email = await prisma.emailEnviado.create({
      data: {
        usuario_id: req.user.id,
        company_id: req.user.company_id,
        cliente_id: cliente_id || null,
        plantilla_id: plantilla_id || null,
        asunto,
        cuerpo: contenido || '',
        estado: 'enviado',
        fecha_envio: new Date()
      }
    });

    res.status(201).json({ ...mapEmail(email), realSent });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar email' });
  }
});

router.post('/email-tracking/:messageId', (req, res) => {
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.set('Content-Type', 'image/gif');
  res.set('Content-Length', pixel.length);
  res.end(pixel);
});

export default router;
