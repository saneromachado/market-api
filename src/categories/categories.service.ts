import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReplaceCategoryDto } from './dto/replace-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch (error) {
      this.throwFriendlyDatabaseError(error);
    }
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (error) {
      this.throwFriendlyDatabaseError(error);
    }
  }

  async replace(id: string, dto: ReplaceCategoryDto) {
    await this.findOne(id);
    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (error) {
      this.throwFriendlyDatabaseError(error);
    }
  }

  deactivate(id: string) {
    return this.update(id, { active: false });
  }

  private throwFriendlyDatabaseError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Já existe uma categoria com este nome');
    }
    throw error;
  }
}
