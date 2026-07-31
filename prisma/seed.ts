import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@market.local';
  const adminName = process.env.ADMIN_NAME ?? 'Administrador';
  const adminPassword = process.env.ADMIN_PASSWORD ?? (isProduction ? undefined : 'admin123');

  if (adminPassword === undefined || adminPassword.length < 8) {
    throw new Error(
      'Defina ADMIN_PASSWORD com pelo menos 8 caracteres antes de executar o seed em produção.',
    );
  }

  const passwordHash = await hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, passwordHash, active: true },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const category = await prisma.category.upsert({
    where: { name: 'Mercearia' },
    update: {},
    create: { name: 'Mercearia', description: 'Produtos de consumo diário' },
  });

  await prisma.product.upsert({
    where: { sku: 'ARROZ-001' },
    update: {},
    create: {
      name: 'Arroz 5kg',
      sku: 'ARROZ-001',
      barcode: '7891000000011',
      price: '29.90',
      stock: 20,
      minimumStock: 5,
      categoryId: category.id,
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
