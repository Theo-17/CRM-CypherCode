import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'CRM <noreply@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

const userResponse = (user, company) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  rol: user.role,
  plan: company?.plan_id || user.plan || 'gratis',
  status: user.status || 'active',
  company_id: user.company_id,
  company_name: company?.name || null,
  created: user.created
});

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, company_id: user.company_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

// POST /api/auth/signup — crea empresa + usuario admin
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, companyName } = req.body;
    if (!email || !password || !name || !companyName) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return res.status(400).json({ message: 'El usuario ya existe' });

    const passwordHash = await bcrypt.hash(password, 10);

    const verificationToken = resend ? crypto.randomBytes(32).toString('hex') : null;
    const verificationExpires = resend ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName, plan_id: 'gratis' }
      });
      const user = await tx.user.create({
        data: {
          email, password: passwordHash, name,
          role: 'admin', plan: 'gratis', status: 'active',
          company_id: company.id,
          email_verified: !resend,
          email_verification_token: verificationToken,
          email_verification_expires: verificationExpires,
        }
      });
      await tx.company.update({ where: { id: company.id }, data: { owner_id: user.id } });
      return { user, company };
    });

    if (resend && verificationToken) {
      const verifyLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
      resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: 'Verifica tu cuenta en CRM CypherCode',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>¡Hola ${name}!</h2>
          <p>Gracias por registrarte. Haz clic para activar tu cuenta:</p>
          <a href="${verifyLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Verificar mi cuenta
          </a>
          <p style="margin-top:16px;color:#666;font-size:12px;">Este link expira en 24 horas.</p>
        </div>`
      }).catch(e => console.error('[auth] Error enviando email de verificación:', e));
      return res.status(201).json({ message: 'Cuenta creada. Revisa tu correo para verificar tu cuenta.', needsVerification: true });
    }

    const token = signToken(result.user);
    res.status(201).json({ token, user: userResponse(result.user, result.company) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al registrarse' });
  }
});

// POST /api/auth/check-email — verifica si el email existe y su estado
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requerido' });
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return res.json({ exists: false });
    res.json({
      exists: true,
      hasPwd: !!user.password,
      isPending: user.status === 'pending'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al verificar email' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { email },
      include: { Company: true }
    });
    if (!user) return res.status(400).json({ message: 'Credenciales inválidas' });

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Tu cuenta está pendiente de activación. Revisa tu correo.', isPending: true });
    }
    if (user.status === 'removed') {
      return res.status(403).json({ message: 'Esta cuenta ha sido eliminada. Contacta al administrador.' });
    }
    if (user.email_verified === false) {
      return res.status(403).json({ message: 'Tu cuenta no está verificada. Revisa tu correo y haz clic en el link de verificación.', needsVerification: true });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Credenciales inválidas' });

    const token = signToken(user);
    res.json({ token, user: userResponse(user, user.Company) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al iniciar sesión' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { Company: true }
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user: userResponse(user, user.Company) });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

// GET /api/auth/invite/:token — valida token de invitación
router.get('/invite/:token', async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { invitation_token: req.params.token },
      include: { Company: true }
    });
    if (!user || !user.invitation_expires || user.invitation_expires < new Date()) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }
    res.json({ email: user.email, companyName: user.Company?.name || '' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al validar invitación' });
  }
});

// POST /api/auth/setup-password — activa cuenta invitada
router.post('/setup-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token y contraseña requeridos' });

    const user = await prisma.user.findFirst({
      where: { invitation_token: token },
      include: { Company: true }
    });
    if (!user || !user.invitation_expires || user.invitation_expires < new Date()) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: hash, status: 'active', invitation_token: null, invitation_expires: null },
      include: { Company: true }
    });

    const jwtToken = signToken(updated);
    res.json({ token: jwtToken, user: userResponse(updated, updated.Company) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al activar cuenta' });
  }
});

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email_verification_token: req.params.token }
    });
    if (!user || !user.email_verification_expires || user.email_verification_expires < new Date()) {
      return res.status(400).json({ message: 'El link de verificación es inválido o ha expirado.' });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { email_verified: true, email_verification_token: null, email_verification_expires: null }
    });
    res.json({ message: 'Email verificado. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al verificar el email.' });
  }
});

// GET /api/auth/google — redirige al flujo OAuth de Google
router.get('/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
  }
  const redirectUri = `${BACKEND_URL}/api/auth/google/callback`;
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&access_type=offline`;
  res.redirect(authUrl);
});

// GET /api/auth/google/callback — Google redirige aquí después del login
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }
  try {
    const redirectUri = `${BACKEND_URL}/api/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description || 'Token exchange failed');

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userInfoRes.json();

    let user = await prisma.user.findFirst({
      where: { google_id: googleUser.id },
      include: { Company: true }
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: googleUser.email },
        include: { Company: true }
      });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { google_id: googleUser.id, email_verified: true },
          include: { Company: true }
        });
      } else {
        const result = await prisma.$transaction(async (tx) => {
          const company = await tx.company.create({
            data: { name: googleUser.name || googleUser.email.split('@')[0], plan_id: 'gratis' }
          });
          const newUser = await tx.user.create({
            data: {
              email: googleUser.email,
              name: googleUser.name,
              google_id: googleUser.id,
              role: 'admin',
              plan: 'gratis',
              status: 'active',
              email_verified: true,
              company_id: company.id,
            }
          });
          await tx.company.update({ where: { id: company.id }, data: { owner_id: newUser.id } });
          return { user: newUser, company };
        });
        user = { ...result.user, Company: result.company };
      }
    }

    if (user.status === 'removed') {
      return res.redirect(`${FRONTEND_URL}/login?error=account_removed`);
    }

    const token = signToken(user);
    res.redirect(`${FRONTEND_URL}/auth/google/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('[auth] Google OAuth error:', err);
    res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requerido' });
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user || user.email_verified !== false) return res.json({ message: 'OK' });
    if (!resend) return res.status(503).json({ message: 'Servicio de email no configurado' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { email_verification_token: token, email_verification_expires: expires }
    });
    const verifyLink = `${FRONTEND_URL}/verify-email?token=${token}`;
    resend.emails.send({
      from: EMAIL_FROM, to: email,
      subject: 'Verifica tu cuenta en CRM CypherCode',
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>¡Hola!</h2>
        <p>Aquí tienes un nuevo link para verificar tu cuenta:</p>
        <a href="${verifyLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Verificar mi cuenta</a>
        <p style="margin-top:16px;color:#666;font-size:12px;">Este link expira en 24 horas.</p>
      </div>`
    }).catch(() => {});
    res.json({ message: 'Email de verificación reenviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al reenviar verificación' });
  }
});

export default router;
