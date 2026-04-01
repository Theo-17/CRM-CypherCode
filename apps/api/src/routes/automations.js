import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Helper function to evaluate conditions
async function evaluateCondition(rule, userId) {
  const { condition_type, condition_value } = rule;

  if (condition_type === 'task_due_today') {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await pb.collection('tareas').getFullList({
      filter: `usuario = "${userId}" && fecha_vencimiento = "${today}" && estado != "completada"`,
    });
    return tasks.length > 0;
  }

  if (condition_type === 'no_seguimiento_days') {
    const days = parseInt(condition_value) || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString().split('T')[0];

    const clientes = await pb.collection('clientes').getFullList({
      filter: `usuario = "${userId}"`,
    });

    const clientesWithoutFollowup = [];
    for (const cliente of clientes) {
      const seguimientos = await pb.collection('seguimientos').getFullList({
        filter: `cliente = "${cliente.id}" && fecha >= "${cutoffISO}"`,
      });
      if (seguimientos.length === 0) {
        clientesWithoutFollowup.push(cliente);
      }
    }
    return clientesWithoutFollowup.length > 0;
  }

  if (condition_type === 'client_status') {
    const status = condition_value;
    const clientes = await pb.collection('clientes').getFullList({
      filter: `usuario = "${userId}" && estado = "${status}"`,
    });
    return clientes.length > 0;
  }

  return false;
}

// Helper function to execute actions
async function executeAction(rule, userId) {
  const { action_type, action_value } = rule;

  if (action_type === 'create_task') {
    const taskData = JSON.parse(action_value);
    await pb.collection('tareas').create({
      usuario: userId,
      titulo: taskData.titulo,
      descripcion: taskData.descripcion || '',
      fecha_vencimiento: taskData.fecha_vencimiento || new Date().toISOString().split('T')[0],
      estado: 'pendiente',
      prioridad: taskData.prioridad || 'media',
    });
    logger.info(`Created task for user ${userId}`);
    return true;
  }

  if (action_type === 'send_email') {
    const emailData = JSON.parse(action_value);
    // Log email for sending (actual sending handled by PocketBase hooks)
    await pb.collection('emails_enviados').create({
      usuario: userId,
      asunto: emailData.asunto,
      contenido: emailData.contenido,
      destinatario: emailData.destinatario,
      abierto: false,
      fecha_envio: new Date().toISOString(),
    });
    logger.info(`Logged email for user ${userId}`);
    return true;
  }

  if (action_type === 'update_status') {
    const statusData = JSON.parse(action_value);
    const clientes = await pb.collection('clientes').getFullList({
      filter: `usuario = "${userId}" && estado = "${statusData.from_status}"`,
    });
    for (const cliente of clientes) {
      await pb.collection('clientes').update(cliente.id, {
        estado: statusData.to_status,
      });
    }
    logger.info(`Updated status for ${clientes.length} clients`);
    return true;
  }

  return false;
}

// POST /execute-automations (admin-only)
router.post('/execute-automations', async (req, res) => {
  const { adminToken } = req.body;

  // Simple admin check - in production, use proper authentication
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  let executedCount = 0;

  try {
    // Get all active automations
    const automations = await pb.collection('automatizaciones').getFullList({
      filter: 'activa = true',
    });

    // Get all users
    const users = await pb.collection('users').getFullList();

    for (const automation of automations) {
      for (const user of users) {
        const conditionMet = await evaluateCondition(automation, user.id);

        if (conditionMet) {
          const actionExecuted = await executeAction(automation, user.id);
          if (actionExecuted) {
            executedCount++;

            // Log execution
            await pb.collection('automatizaciones').update(automation.id, {
              ultima_ejecucion: new Date().toISOString(),
              ejecuciones_totales: (automation.ejecuciones_totales || 0) + 1,
            });
          }
        }
      }
    }

    logger.info(`Executed ${executedCount} automations`);
    res.json({ executed: executedCount });
  } catch (error) {
    logger.error('Error executing automations:', error);
    throw error;
  }
});

export default router;