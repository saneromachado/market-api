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

  const categoryDefinitions = [
    { name: 'Mercearia', description: 'Alimentos básicos e itens de despensa' },
    { name: 'Bebidas', description: 'Bebidas alcoólicas e não alcoólicas' },
    { name: 'Higiene', description: 'Cuidados pessoais e higiene' },
    { name: 'Limpeza', description: 'Produtos para limpeza doméstica' },
    { name: 'Hortifruti', description: 'Frutas, legumes e verduras' },
  ];
  const categoryIds = new Map<string, string>();

  for (const definition of categoryDefinitions) {
    const category = await prisma.category.upsert({
      where: { name: definition.name },
      update: { description: definition.description, active: true },
      create: { ...definition, active: true },
    });
    categoryIds.set(category.name, category.id);
  }

  const productDefinitions = [
    {
      category: 'Mercearia',
      name: 'Arroz 5kg',
      sku: 'ARROZ-001',
      barcode: '00000001',
      price: '29.90',
      stock: 20,
      minimumStock: 5,
    },
    {
      category: 'Mercearia',
      name: 'Feijão Carioca 1kg',
      sku: 'FEIJAO-001',
      barcode: '00000002',
      price: '8.99',
      stock: 30,
      minimumStock: 8,
    },
    {
      category: 'Mercearia',
      name: 'Macarrão Espaguete 500g',
      sku: 'MACARRAO-001',
      barcode: '00000003',
      price: '5.49',
      stock: 25,
      minimumStock: 6,
    },
    {
      category: 'Mercearia',
      name: 'Açúcar Refinado 1kg',
      sku: 'ACUCAR-001',
      barcode: '00000004',
      price: '4.79',
      stock: 24,
      minimumStock: 6,
    },
    {
      category: 'Mercearia',
      name: 'Café Torrado 500g',
      sku: 'CAFE-001',
      barcode: '00000005',
      price: '18.90',
      stock: 18,
      minimumStock: 5,
    },
    {
      category: 'Bebidas',
      name: 'Água Mineral 1,5L',
      sku: 'AGUA-001',
      barcode: '00000006',
      price: '3.49',
      stock: 40,
      minimumStock: 10,
    },
    {
      category: 'Bebidas',
      name: 'Refrigerante Cola 2L',
      sku: 'REFRI-001',
      barcode: '00000007',
      price: '10.99',
      stock: 24,
      minimumStock: 6,
    },
    {
      category: 'Bebidas',
      name: 'Suco de Laranja 1L',
      sku: 'SUCO-001',
      barcode: '00000008',
      price: '8.49',
      stock: 20,
      minimumStock: 5,
    },
    {
      category: 'Bebidas',
      name: 'Leite Integral 1L',
      sku: 'LEITE-001',
      barcode: '00000009',
      price: '5.89',
      stock: 30,
      minimumStock: 8,
    },
    {
      category: 'Bebidas',
      name: 'Cerveja Pilsen 350ml',
      sku: 'CERVEJA-001',
      barcode: '00000010',
      price: '4.99',
      stock: 48,
      minimumStock: 12,
    },
    {
      category: 'Higiene',
      name: 'Sabonete 90g',
      sku: 'SABONETE-001',
      barcode: '00000011',
      price: '3.29',
      stock: 30,
      minimumStock: 8,
    },
    {
      category: 'Higiene',
      name: 'Shampoo 350ml',
      sku: 'SHAMPOO-001',
      barcode: '00000012',
      price: '14.90',
      stock: 16,
      minimumStock: 4,
    },
    {
      category: 'Higiene',
      name: 'Creme Dental 90g',
      sku: 'CREME-DENTAL-001',
      barcode: '00000013',
      price: '6.99',
      stock: 24,
      minimumStock: 6,
    },
    {
      category: 'Higiene',
      name: 'Papel Higiênico 4 rolos',
      sku: 'PAPEL-HIG-001',
      barcode: '00000014',
      price: '9.90',
      stock: 20,
      minimumStock: 5,
    },
    {
      category: 'Higiene',
      name: 'Desodorante Aerosol 150ml',
      sku: 'DESODORANTE-001',
      barcode: '00000015',
      price: '12.49',
      stock: 18,
      minimumStock: 5,
    },
    {
      category: 'Limpeza',
      name: 'Detergente 500ml',
      sku: 'DETERGENTE-001',
      barcode: '00000016',
      price: '2.99',
      stock: 36,
      minimumStock: 10,
    },
    {
      category: 'Limpeza',
      name: 'Água Sanitária 2L',
      sku: 'AGUA-SANITARIA-001',
      barcode: '00000017',
      price: '7.49',
      stock: 20,
      minimumStock: 5,
    },
    {
      category: 'Limpeza',
      name: 'Sabão em Pó 1kg',
      sku: 'SABAO-PO-001',
      barcode: '00000018',
      price: '13.90',
      stock: 18,
      minimumStock: 5,
    },
    {
      category: 'Limpeza',
      name: 'Desinfetante 2L',
      sku: 'DESINFETANTE-001',
      barcode: '00000019',
      price: '8.99',
      stock: 20,
      minimumStock: 5,
    },
    {
      category: 'Limpeza',
      name: 'Esponja Multiuso',
      sku: 'ESPONJA-001',
      barcode: '00000020',
      price: '2.49',
      stock: 40,
      minimumStock: 10,
    },
    {
      category: 'Hortifruti',
      name: 'Banana Prata 1kg',
      sku: 'BANANA-001',
      barcode: '00000021',
      price: '6.99',
      stock: 15,
      minimumStock: 4,
    },
    {
      category: 'Hortifruti',
      name: 'Maçã Gala 1kg',
      sku: 'MACA-001',
      barcode: '00000022',
      price: '9.49',
      stock: 15,
      minimumStock: 4,
    },
    {
      category: 'Hortifruti',
      name: 'Tomate 1kg',
      sku: 'TOMATE-001',
      barcode: '00000023',
      price: '7.99',
      stock: 18,
      minimumStock: 5,
    },
    {
      category: 'Hortifruti',
      name: 'Batata 1kg',
      sku: 'BATATA-001',
      barcode: '00000024',
      price: '6.49',
      stock: 20,
      minimumStock: 5,
    },
    {
      category: 'Hortifruti',
      name: 'Cebola 1kg',
      sku: 'CEBOLA-001',
      barcode: '00000025',
      price: '5.99',
      stock: 20,
      minimumStock: 5,
    },
  ];

  for (const product of productDefinitions) {
    const { category, ...data } = product;
    const categoryId = categoryIds.get(category);
    if (categoryId === undefined) {
      throw new Error(`Categoria não encontrada durante o seed: ${category}`);
    }

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: data.name,
        barcode: data.barcode,
        price: data.price,
        minimumStock: data.minimumStock,
        categoryId,
        active: true,
      },
      create: { ...data, categoryId, active: true },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
