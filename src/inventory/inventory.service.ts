import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MovementType, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { QueryMovementsDto } from './dto/query-movements.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  createMovement(dto: CreateMovementDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: dto.productId },
        });
        if (!product) throw new NotFoundException('Produto não encontrado');
        if (!product.active)
          throw new BadRequestException('Produto inativo não pode ser movimentado');

        const currentStock =
          dto.type === MovementType.ENTRY
            ? product.stock + dto.quantity
            : dto.type === MovementType.EXIT
              ? product.stock - dto.quantity
              : dto.quantity;

        if (currentStock < 0) throw new BadRequestException('Estoque insuficiente para esta saída');

        await tx.product.update({
          where: { id: product.id },
          data: { stock: currentStock },
        });
        return tx.stockMovement.create({
          data: {
            productId: product.id,
            type: dto.type,
            quantity: Math.abs(currentStock - product.stock),
            previousStock: product.stock,
            currentStock,
            reason: dto.reason,
          },
          include: { product: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async findMovements(query: QueryMovementsDto) {
    const { productId, page, limit } = query;
    const where = productId ? { productId } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        include: { product: { select: { id: true, name: true, sku: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  lowStock() {
    return this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        sku: string;
        stock: number;
        minimumStock: number;
      }>
    >`SELECT id, name, sku, stock, "minimumStock"
      FROM "Product"
      WHERE active = true AND stock <= "minimumStock"
      ORDER BY stock ASC, name ASC`;
  }
}
