import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    await this.ensureCategory(dto.categoryId);
    try {
      return await this.prisma.product.create({
        data: dto,
        include: { category: true },
      });
    } catch (error) {
      this.throwFriendlyDatabaseError(error);
    }
  }

  async findAll(query: QueryProductsDto) {
    const { page, limit, search, active } = query;
    const where: Prisma.ProductWhereInput = {
      ...(active === undefined ? {} : { active }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    if (dto.categoryId) await this.ensureCategory(dto.categoryId);
    try {
      return await this.prisma.product.update({
        where: { id },
        data: dto,
        include: { category: true },
      });
    } catch (error) {
      this.throwFriendlyDatabaseError(error);
    }
  }

  deactivate(id: string) {
    return this.update(id, { active: false });
  }

  private async ensureCategory(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, active: true },
    });
    if (!category) throw new NotFoundException('Categoria ativa não encontrada');
  }

  private throwFriendlyDatabaseError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('SKU ou código de barras já cadastrado');
    }
    throw error;
  }
}
