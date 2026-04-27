import express from 'express';
import crypto from 'crypto';
import { Resend } from 'resend';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { FEATURE_LIMITS } from './features.js';

const router = express.Router();
router.use(authMiddleware);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'CRM <noreply@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';

const userResponse = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  rol: u.role,
  plan: u.plan || 'gratis',
  status: u.status || 'active',
  company_id: u.company_id,
  created: u.created
});

// GET / — listar usuarios de la empresa
router.get('/', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
  try {
    const users = await prisma.user.findMany({
      where: { company_id: req.user.company_id, status: { not: 'removed' } },
      orderBy: { created: 'desc' }
    });
    res.json(users.map(userResponse));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// POST /invite — invitar a un vendedor
router.post('/invite', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo el admin puede invitar usuarios' });
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ message: 'Email y nombre son requeridos' });

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing && existing.status !== 'removed') {
      return res.status(400).json({ message: 'Ya existe un usuario activo con ese email. Por favor usa otro correo.' });
    }
    if (existing && existing.status === 'removed') {
      return res.status(400).json({ message: 'Este email pertenece a un usuario previamente eliminado. Por favor usa otro correo.' });
    }

    const company = await prisma.company.findUnique({ where: { id: req.user.company_id } });
    const plan = company?.plan_id || 'gratis';
    const userLimit = FEATURE_LIMITS[plan]?.usuarios ?? 2;
    if (userLimit !== Infinity) {
      const userCount = await prisma.user.count({
        where: { company_id: req.user.company_id, status: { not: 'removed' } }
      });
      if (userCount >= userLimit) {
        return res.status(403).json({
          message: `Tu plan ${plan} permite máximo ${userLimit} usuario${userLimit !== 1 ? 's' : ''}. Actualiza tu suscripción para agregar más.`
        });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        company_id: req.user.company_id,
        role: 'seller',
        status: 'pending',
        invitation_token: token,
        invitation_expires: expires,
        plan: 'gratis'
      }
    });

    const inviteLink = `${FRONTEND_URL}/setup-password?token=${token}`;

    if (resend) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `Has sido invitado a ${company?.name || 'un CRM'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>¡Hola ${name}!</h2>
            <p>Has sido invitado a unirte a <strong>${company?.name || 'nuestro CRM'}</strong>.</p>
            <p>Haz clic en el siguiente botón para crear tu contraseña y activar tu cuenta:</p>
            <a href="${inviteLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Unirse a ${company?.name || 'CRM'}
            </a>
            <p style="margin-top:16px;color:#666;font-size:12px;">Este link expira en 7 días.</p>
          </div>
        `
      });
    }

    res.status(201).json(userResponse(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al enviar invitación' });
  }
});

// POST /:id/resend-invite — reenviar invitación
router.post('/:id/resend-invite', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo el admin puede reenviar invitaciones' });
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { Company: true }
    });

    if (!user || user.company_id !== req.user.company_id) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'El usuario ya está activo' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { invitation_token: token, invitation_expires: expires }
    });

    const inviteLink = `${FRONTEND_URL}/setup-password?token=${token}`;
    const companyName = user.Company?.name || 'nuestro CRM';

    if (resend) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: `Recordatorio: Únete a ${companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>¡Hola ${user.name}!</h2>
            <p>Te recordamos que fuiste invitado a <strong>${companyName}</strong>.</p>
            <a href="${inviteLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Unirse a ${companyName}
            </a>
            <p style="margin-top:16px;color:#666;font-size:12px;">Este link expira en 7 días.</p>
          </div>
        `
      });
    }

    res.json({ message: 'Invitación reenviada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al reenviar invitación' });
  }
});

// DELETE /:id — eliminar usuario (soft delete para activos, hard delete para pendientes)
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
  if (req.user.id === req.params.id) return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || user.company_id !== req.user.company_id) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (user.status === 'pending') {
      await prisma.user.delete({ where: { id: req.params.id } });
    } else {
      await prisma.user.update({
        where: { id: req.params.id },
        data: { status: 'removed', password: null, invitation_token: null, invitation_expires: null }
      });
    }
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

export default router;
