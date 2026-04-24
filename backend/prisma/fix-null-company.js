import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Fetch all users that have a company assigned
  const users = await prisma.user.findMany({
    where: { company_id: { not: null } },
    select: { id: true, email: true, company_id: true }
  });

  if (users.length === 0) {
    console.log('No users with company_id found. Nothing to fix.');
    return;
  }

  console.log(`Found ${users.length} user(s) with company_id. Fixing orphaned records...\n`);

  let totalFixed = 0;

  for (const user of users) {
    const cid = user.company_id;
    const uid = user.id;

    const models = [
      { name: 'Cliente',        table: prisma.cliente },
      { name: 'Tarea',          table: prisma.tarea },
      { name: 'Seguimiento',    table: prisma.seguimiento },
      { name: 'Venta',          table: prisma.venta },
      { name: 'Producto',       table: prisma.producto },
      { name: 'EmailEnviado',   table: prisma.emailEnviado },
      { name: 'PlantillaEmail', table: prisma.plantillaEmail },
      { name: 'Actividad',      table: prisma.actividad },
      { name: 'Automatizacion', table: prisma.automatizacion },
      { name: 'Notificacion',   table: prisma.notificacion },
      { name: 'Integracion',    table: prisma.integracion },
    ];

    let userFixed = 0;

    for (const { name, table } of models) {
      try {
        const result = await table.updateMany({
          where: { usuario_id: uid, company_id: null },
          data: { company_id: cid }
        });
        if (result.count > 0) {
          console.log(`  [${user.email}] ${name}: fixed ${result.count} record(s)`);
          userFixed += result.count;
        }
      } catch {
        // Model might not have company_id — skip silently
      }
    }

    if (userFixed === 0) {
      console.log(`  [${user.email}] Nothing to fix`);
    }
    totalFixed += userFixed;
  }

  console.log(`\nDone. Total records fixed: ${totalFixed}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
