import type { PrismaClient } from '@prisma/client'
import type { CategoryType } from '@finance-ai/core/domain/value-objects/enums'
import { Category } from '@finance-ai/core/domains/category'
import type { CategoryRepository } from '@finance-ai/core/domains/category'
import { CategoryMapper } from '../mappers/category.mapper'

export class CategoryPrismaRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(category: Category): Promise<Category> {
    const data = CategoryMapper.toPersistence(category)
    const saved = await this.prisma.category.upsert({
      where: { id: category.id },
      create: data,
      update: data,
    })
    return CategoryMapper.toDomain(saved)
  }

  async findById(id: string): Promise<Category | null> {
    const record = await this.prisma.category.findUnique({ where: { id } })
    return record ? CategoryMapper.toDomain(record) : null
  }

  async findByNameAndType(name: string, type: CategoryType): Promise<Category | null> {
    const records = await this.prisma.category.findMany({ where: { type } })
    const match = records.find((record) => Category.namesEqual(record.name, name))
    return match ? CategoryMapper.toDomain(match) : null
  }

  async findAllByType(type?: CategoryType): Promise<Category[]> {
    const records = await this.prisma.category.findMany({
      where: type ? { type } : undefined,
    })
    return records.map(CategoryMapper.toDomain)
  }
}
