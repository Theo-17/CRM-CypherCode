import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

const userResponse = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  rol: user.role,
  plan: user.plan || 'gratis',
  created: user.created
});

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return res.status(400).json({ message: 'El usuario ya existe' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({
      data: { email, password: passwordHash, name, role: 'vendedor', plan: 'gratis' }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: userResponse(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al registrarse' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: userResponse(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al iniciar sesión' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user: userResponse(user) });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

export default router;
