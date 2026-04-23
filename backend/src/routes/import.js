import express from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV debe tener encabezado y al menos una fila');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/import-clients', authMiddleware, async (req, res) => {
  const { csvContent } = req.body;
  const userId = req.user.id;

  if (!csvContent) return res.status(400).json({ error: 'csvContent requerido' });

  let imported = 0, skipped = 0;
  const errors = [];

  try {
    const rows = parseCSV(csvContent);
    const existingClientes = await prisma.cliente.findMany({
      where: { usuario_id: userId },
      select: { email: true }
    });
    const existingEmails = new Set(existingClientes.map(c => c.email?.toLowerCase()).filter(Boolean));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;
      try {
        if (!row.nombre) {
          errors.push({ row: rowNumber, error: 'Falta nombre' });
          skipped++; continue;
        }
        if (row.email && !isValidEmail(row.email)) {
          errors.push({ row: rowNumber, error: `Email inválido: ${row.email}` });
          skipped++; continue;
        }
        if (row.email && existingEmails.has(row.email.toLowerCase())) {
          errors.push({ row: rowNumber, error: `Email duplicado: ${row.email}` });
          skipped++; continue;
        }
        await prisma.cliente.create({
          data: {
            usuario_id: userId,
            nombre: row.nombre,
            email: row.email || null,
            telefono: row.telefono || null,
            empresa: row.empresa || null,
            estado: row.estado || 'Activo',
            notas: row.notas || null
          }
        });
        if (row.email) existingEmails.add(row.email.toLowerCase());
        imported++;
      } catch (error) {
        errors.push({ row: rowNumber, error: error.message });
        skipped++;
      }
    }

    logger.info(`Importados ${imported}, saltados ${skipped}`);
    res.json({ imported, skipped, errors });
  } catch (error) {
    logger.error('Error en importación:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
