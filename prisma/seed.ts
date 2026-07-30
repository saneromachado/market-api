import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@market.local' },
    update: { passwordHash, active: true },
    create: {
      name: 'Administrador',
      email: 'admin@market.local',
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
