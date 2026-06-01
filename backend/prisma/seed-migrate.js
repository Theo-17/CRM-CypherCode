import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando migración de datos a multi-tenant...');

  const usersWithoutCompany = await prisma.user.findMany({
    where: { company_id: null }
  });

  console.log(`Usuarios a migrar: ${usersWithoutCompany.length}`);

  for (const user of usersWithoutCompany) {
    console.log(`Migrando usuario: ${user.email}`);

    await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: user.name ? `${user.name}'s Company` : `${user.email.split('@')[0]}'s Company`,
          plan_id: user.plan || 'gratis',
          owner_id: user.id
        }
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          company_id: company.id,
          role: 'admin',
          status: 'active'
        }
      });

      const tables = [
        { model: 'cliente', field: 'usuario_id' },
        { model: 'venta', field: 'usuario_id' },
        { model: 'producto', field: 'usuario_id' },
        { model: 'tarea', field: 'usuario_id' },
        { model: 'seguimiento', field: 'usuario_id' },
        { model: 'emailEnviado', field: 'usuario_id' },
        { model: 'plantillaEmail', field: 'usuario_id' },
        { model: 'actividad', field: 'usuario_id' },
        { model: 'automatizacion', field: 'usuario_id' },
        { model: 'notificacion', field: 'usuario_id' },
        { model: 'integracion', field: 'usuario_id' }
      ];

      for (const { model, field } of tables) {
        await tx[model].updateMany({
          where: { [field]: user.id, company_id: null },
          data: { company_id: company.id }
        });
      }

      // Back-fill IVA en ventas existentes
      const ventas = await tx.venta.findMany({
        where: { usuario_id: user.id, monto_sin_iva: 0 }
      });

      for (const venta of ventas) {
        const total = Number(venta.monto_total) || 0;
        if (total > 0) {
          const sinIva = parseFloat((total / 1.15).toFixed(2));
          const iva = parseFloat((total - sinIva).toFixed(2));
          await tx.venta.update({
            where: { id: venta.id },
            data: { monto_sin_iva: sinIva, iva_monto: iva }
          });
        }
      }

      console.log(`  ✓ Company "${company.name}" creada (id: ${company.id})`);
    });
  }

  console.log('Migración completada.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
