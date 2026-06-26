import type { Category as PrismaCategory } from '@prisma/client'
import { Category } from '@finance-ai/core/domains/category'
import type { CategoryType } from '@finance-ai/core/domain/value-objects/enums'

export type CategoryPersistence = {
  id: string
  name: string
  type: CategoryType
  createdAt: Date
  updatedAt: Date
}

export const CategoryMapper = {
  toDomain(record: PrismaCategory): Category {
    return Category.reconstitute({
      id: record.id,
      name: record.name,
      type: record.type as CategoryType,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  },

  toPersistence(category: Category): CategoryPersistence {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }
  },
}
