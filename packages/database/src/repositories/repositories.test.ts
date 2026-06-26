import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { Category } from '@finance-ai/core/domains/category'
import { Expense } from '@finance-ai/core/domains/expense'
import { Revenue } from '@finance-ai/core/domains/revenue'
import { Supplier } from '@finance-ai/core/domains/supplier'
import { User } from '@finance-ai/core/domains/user'
import { CategoryPrismaRepository } from './category.prisma-repository'
import { ExpensePrismaRepository } from './expense.prisma-repository'
import { RevenuePrismaRepository } from './revenue.prisma-repository'
import { SupplierPrismaRepository } from './supplier.prisma-repository'
import { UserPrismaRepository } from './user.prisma-repository'

const now = new Date('2025-06-01T10:00:00Z')

function createExpense(overrides: Partial<{ deletedAt: Date | null }> = {}) {
  return Expense.create({
    id: 'exp-1',
    description: 'Test',
    amount: 10,
    categoryId: 'cat-1',
    date: new Date('2025-01-01'),
    source: 'MANUAL',
    now,
    ...overrides,
  })
}

describe('Prisma repositories (unit)', () => {
  describe('ExpensePrismaRepository', () => {
    const prisma = {
      expense: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
    } as unknown as PrismaClient
    const repository = new ExpensePrismaRepository(prisma)

    beforeEach(() => vi.clearAllMocks())

    it('findById returns null when missing', async () => {
      vi.mocked(prisma.expense.findUnique).mockResolvedValue(null)
      await expect(repository.findById('missing')).resolves.toBeNull()
    })

    it('findMany applies optional filters', async () => {
      vi.mocked(prisma.expense.findMany).mockResolvedValue([])
      vi.mocked(prisma.expense.count).mockResolvedValue(0)
      await repository.findMany({ includeDeleted: true, categoryId: 'cat-1' }, { page: 1, limit: 5 })
      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { categoryId: 'cat-1' },
          take: 5,
        }),
      )
    })
  })

  describe('RevenuePrismaRepository', () => {
    const prisma = {
      revenue: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
    } as unknown as PrismaClient
    const repository = new RevenuePrismaRepository(prisma)

    beforeEach(() => vi.clearAllMocks())

    it('findById returns null when missing', async () => {
      vi.mocked(prisma.revenue.findUnique).mockResolvedValue(null)
      await expect(repository.findById('missing')).resolves.toBeNull()
    })

    it('findMany includes deleted when requested', async () => {
      vi.mocked(prisma.revenue.findMany).mockResolvedValue([])
      vi.mocked(prisma.revenue.count).mockResolvedValue(0)
      await repository.findMany({ includeDeleted: true }, { page: 2, limit: 10 })
      expect(prisma.revenue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 10,
        }),
      )
    })
  })

  describe('CategoryPrismaRepository', () => {
    const prisma = {
      category: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    } as unknown as PrismaClient
    const repository = new CategoryPrismaRepository(prisma)

    beforeEach(() => vi.clearAllMocks())

    it('findById returns null when missing', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
      await expect(repository.findById('missing')).resolves.toBeNull()
    })

    it('findByNameAndType returns null when no match', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([
        {
          id: '1',
          name: 'Other',
          type: 'EXPENSE',
          createdAt: now,
          updatedAt: now,
        },
      ])
      await expect(repository.findByNameAndType('Marketing', 'EXPENSE')).resolves.toBeNull()
    })

    it('findAllByType without filter', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([])
      await repository.findAllByType()
      expect(prisma.category.findMany).toHaveBeenCalledWith({ where: undefined })
    })
  })

  describe('SupplierPrismaRepository', () => {
    const prisma = {
      supplier: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    } as unknown as PrismaClient
    const repository = new SupplierPrismaRepository(prisma)

    beforeEach(() => vi.clearAllMocks())

    it('findById returns null when missing', async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null)
      await expect(repository.findById('missing')).resolves.toBeNull()
    })

    it('findByName returns null when no match', async () => {
      vi.mocked(prisma.supplier.findMany).mockResolvedValue([
        {
          id: '1',
          name: 'Other',
          document: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      await expect(repository.findByName('Acme')).resolves.toBeNull()
    })
  })

  describe('UserPrismaRepository', () => {
    const prisma = {
      user: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    } as unknown as PrismaClient
    const repository = new UserPrismaRepository(prisma)

    beforeEach(() => vi.clearAllMocks())

    it('findById returns null when missing', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      await expect(repository.findById('missing')).resolves.toBeNull()
    })

    it('findByEmail returns null when missing', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      await expect(repository.findByEmail('missing@example.com')).resolves.toBeNull()
    })
  })

  describe('save paths', () => {
    it('ExpensePrismaRepository save maps domain entity', async () => {
      const expense = createExpense()
      const prisma = {
        expense: {
          upsert: vi.fn().mockResolvedValue({
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            categoryId: expense.categoryId,
            supplierId: expense.supplierId,
            date: expense.date,
            source: expense.source,
            confidence: expense.confidence,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
            deletedAt: expense.deletedAt,
          }),
        },
      } as unknown as PrismaClient
      const saved = await new ExpensePrismaRepository(prisma).save(expense)
      expect(saved.id).toBe(expense.id)
    })

    it('CategoryPrismaRepository save maps domain entity', async () => {
      const category = Category.create({ id: 'cat-1', name: 'Tools', type: 'EXPENSE', now })
      const prisma = {
        category: {
          upsert: vi.fn().mockResolvedValue({
            id: category.id,
            name: category.name,
            type: category.type,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
          }),
        },
      } as unknown as PrismaClient
      const saved = await new CategoryPrismaRepository(prisma).save(category)
      expect(saved.name).toBe('Tools')
    })

    it('RevenuePrismaRepository save maps domain entity', async () => {
      const revenue = Revenue.create({
        id: 'rev-1',
        description: 'Sale',
        amount: 100,
        date: new Date('2025-01-01'),
        source: 'MANUAL',
        now,
      })
      const prisma = {
        revenue: {
          upsert: vi.fn().mockResolvedValue({
            id: revenue.id,
            description: revenue.description,
            amount: revenue.amount,
            date: revenue.date,
            source: revenue.source,
            createdAt: revenue.createdAt,
            updatedAt: revenue.updatedAt,
            deletedAt: revenue.deletedAt,
          }),
        },
      } as unknown as PrismaClient
      const saved = await new RevenuePrismaRepository(prisma).save(revenue)
      expect(saved.amount).toBe(100)
    })

    it('SupplierPrismaRepository save maps domain entity', async () => {
      const supplier = Supplier.create({ id: 'sup-1', name: 'Acme Corp', now })
      const prisma = {
        supplier: {
          upsert: vi.fn().mockResolvedValue({
            id: supplier.id,
            name: supplier.name,
            document: supplier.document,
            createdAt: supplier.createdAt,
            updatedAt: supplier.updatedAt,
            deletedAt: supplier.deletedAt,
          }),
        },
      } as unknown as PrismaClient
      const saved = await new SupplierPrismaRepository(prisma).save(supplier)
      expect(saved.name).toBe('Acme Corp')
    })

    it('UserPrismaRepository save maps domain entity', async () => {
      const user = User.create({
        id: 'user-1',
        name: 'Alex',
        email: 'alex@example.com',
        role: 'ADMIN',
        now,
      })
      const prisma = {
        user: {
          upsert: vi.fn().mockResolvedValue({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }),
        },
      } as unknown as PrismaClient
      const saved = await new UserPrismaRepository(prisma).save(user)
      expect(saved.email).toBe('alex@example.com')
    })
  })
})
