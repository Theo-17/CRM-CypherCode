import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Helper function to parse CSV
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have header and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// POST /import-clients
router.post('/import-clients', async (req, res) => {
  const { csvContent, userId } = req.body;

  if (!csvContent || !userId) {
    return res.status(400).json({ error: 'csvContent and userId are required' });
  }

  let imported = 0;
  let skipped = 0;
  const errors = [];

  try {
    const rows = parseCSV(csvContent);

    // Get existing emails for this user to check for duplicates
    const existingClientes = await pb.collection('clientes').getFullList({
      filter: `usuario = "${userId}"`,
    });
    const existingEmails = new Set(existingClientes.map(c => c.email?.toLowerCase()));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because of header and 0-indexing

      try {
        // Validate required fields
        if (!row.nombre || !row.email) {
          errors.push({ row: rowNumber, error: 'Missing nombre or email' });
          skipped++;
          continue;
        }

        // Validate email format
        if (!isValidEmail(row.email)) {
          errors.push({ row: rowNumber, error: `Invalid email format: ${row.email}` });
          skipped++;
          continue;
        }

        // Check for duplicates
        if (existingEmails.has(row.email.toLowerCase())) {
          errors.push({ row: rowNumber, error: `Duplicate email: ${row.email}` });
          skipped++;
          continue;
        }

        // Create cliente record
        await pb.collection('clientes').create({
          usuario: userId,
          nombre: row.nombre,
          email: row.email,
          telefono: row.telefono || '',
          empresa: row.empresa || '',
          estado: row.estado || 'prospecto',
          notas: row.notas || '',
        });

        existingEmails.add(row.email.toLowerCase());
        imported++;
      } catch (error) {
        errors.push({ row: rowNumber, error: error.message });
        skipped++;
      }
    }

    logger.info(`Imported ${imported} clients, skipped ${skipped}`);
    res.json({ imported, skipped, errors });
  } catch (error) {
    logger.error('Error importing clients:', error);
    throw error;
  }
});

export default router;