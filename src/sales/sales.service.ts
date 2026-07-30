import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MovementType, Prisma, SaleStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';

const saleInclude = {
  user: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, sku: true, barcode: true } },
    },
  },
} satisfies Prisma.SaleInclude;

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSaleDto, userId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const productIds = dto.items.map((item) => item.productId);
        if (new Set(productIds).size !== productIds.length) {
          throw new BadRequestException('Cada produto deve aparecer apenas uma vez na venda');
        }

        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });
        if (products.length !== productIds.length)
          throw new NotFoundException('Um ou mais produtos não foram encontrados');

        let subtotal = new Prisma.Decimal(0);
        const saleItems = dto.items.map((item) => {
          const product = products.find(({ id }) => id === item.productId)!;
          if (!product.active) throw new BadRequestException(`Produto inativo: ${product.name}`);
          if (product.stock < item.quantity)
            throw new BadRequestException(`Estoque insuficiente para ${product.name}`);
          const total = product.price.mul(item.quantity);
          subtotal = subtotal.add(total);
          return {
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.price,
            total,
          };
        });

        const discount = new Prisma.Decimal(dto.discount);
        if (discount.greaterThan(subtotal))
          throw new BadRequestException('Desconto não pode superar o subtotal');

        const sale = await tx.sale.create({
          data: {
            paymentMethod: dto.paymentMethod,
            subtotal,
            discount,
            total: subtotal.sub(discount),
            userId,
            items: { create: saleItems },
          },
        });

        for (const item of dto.items) {
          const product = products.find(({ id }) => id === item.productId)!;
          const currentStock = product.stock - item.quantity;
          await tx.product.update({
            where: { id: product.id },
            data: { stock: currentStock },
          });
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              type: MovementType.SALE,
              quantity: item.quantity,
              previousStock: product.stock,
              currentStock,
              reason: `Venda #${sale.number}`,
              referenceId: sale.id,
            },
          });
        }

        return tx.sale.findUniqueOrThrow({
          where: { id: sale.id },
          include: saleInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async findAll(query: QuerySalesDto) {
    const { status, page, limit } = query;
    const where = status ? { status } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        include: saleInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: saleInclude,
    });
    if (!sale) throw new NotFoundException('Venda não encontrada');
    return sale;
  }

  cancel(id: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const sale = await tx.sale.findUnique({
          where: { id },
          include: { items: true },
        });
        if (!sale) throw new NotFoundException('Venda não encontrada');

        if (sale.status === SaleStatus.CANCELLED) {
          return tx.sale.findUniqueOrThrow({
            where: { id },
            include: saleInclude,
          });
        }

        for (const item of sale.items) {
          const product = await tx.product.findUniqueOrThrow({
            where: { id: item.productId },
          });
          const currentStock = product.stock + item.quantity;
          await tx.product.update({
            where: { id: product.id },
            data: { stock: currentStock },
          });
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              type: MovementType.SALE_CANCELLATION,
              quantity: item.quantity,
              previousStock: product.stock,
              currentStock,
              reason: `Cancelamento da venda #${sale.number}`,
              referenceId: sale.id,
            },
          });
        }

        return tx.sale.update({
          where: { id },
          data: { status: SaleStatus.CANCELLED, cancelledAt: new Date() },
          include: saleInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
