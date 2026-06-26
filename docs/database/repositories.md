# Repositórios — Domain → Prisma

**Epic:** 03  
**Pacote:** `@finance-ai/database`

## Fluxo arquitetural

```
Use Case (packages/core)
    ↓
Repository Interface (domain/*.repository.ts)
    ↓
Prisma Repository (packages/database/src/repositories/)
    ↓
Mapper (packages/database/src/mappers/)
    ↓
Prisma Client → SQLite
```

## Princípios

1. **Domínio é fonte de verdade** — entidades, value objects e regras ficam em `@finance-ai/core`.
2. **Prisma não contém regras de negócio** — apenas persistência e queries.
3. **Mappers explícitos** — conversão Prisma ↔ Domain isolada em `src/mappers/`.
4. **Use cases nunca importam Prisma** — dependem apenas de interfaces.

## Repositórios implementados

| Interface (core) | Implementação (database) |
|------------------|--------------------------|
| ExpenseRepository | ExpensePrismaRepository |
| RevenueRepository | RevenuePrismaRepository |
| CategoryRepository | CategoryPrismaRepository |
| SupplierRepository | SupplierPrismaRepository |
| UserRepository | UserPrismaRepository |

## Mappers

Cada mapper expõe:

- `toDomain(record)` — registro Prisma → entidade de domínio via `Entity.reconstitute()`
- `toPersistence(entity)` — entidade → objeto para upsert Prisma

## Uso

```typescript
import { prisma, ExpensePrismaRepository } from '@finance-ai/database'
import { CreateExpenseUseCase } from '@finance-ai/core/domains/expense'

const expenseRepository = new ExpensePrismaRepository(prisma)
const createExpense = new CreateExpenseUseCase(expenseRepository, /* ... */)
```

## Testes de integração

`packages/database/tests/` — SQLite isolado por suite via `createIsolatedTestDatabase()`.

Validam Create, Update, GetById, List e SoftDelete através dos use cases existentes.

## Substituição InMemory → Prisma

Os repositórios InMemory em `packages/core/.../infrastructure/` permanecem para testes unitários do domínio.

Em runtime (Epic 04+), injetar implementações Prisma via composição na camada de aplicação/API.
