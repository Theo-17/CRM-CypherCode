import cron from 'node-cron';
import prisma from './prisma.js';

export const startReminderCron = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const pending = await prisma.recordatorio.findMany({
        where: { fecha_recordatorio: { lte: new Date() }, enviado: false },
        include: { Tarea: true, User: true }
      });

      for (const rec of pending) {
        await prisma.notificacion.create({
          data: {
            usuario_id: rec.usuario_id,
            company_id: rec.User?.company_id ?? null,
            tipo: 'recordatorio',
            mensaje: `Recordatorio: ${rec.Tarea?.titulo || 'Tarea pendiente'}`,
            leida: false
          }
        }).catch(() => {});

        await prisma.recordatorio.update({
          where: { id: rec.id },
          data: { enviado: true }
        });
      }
    } catch (err) {
      console.error('[reminderCron]', err.message);
    }
  });
};
