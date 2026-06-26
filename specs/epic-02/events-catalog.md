# Catálogo de Eventos — Epic 02

**Versão:** 1.0.0  
**Transporte:** Event Bus interno (ADR-002)

Todos os eventos seguem estrutura base:

```typescript
interface DomainEvent<TPayload> {
  name: DomainEventName
  payload: TPayload
  occurredAt: Date
  correlationId?: string
}
```

---

## Expense

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `ExpenseCreated` | Despesa criada | `{ expenseId: string, amount: number, categoryId: string, source: ExpenseSource, confidence: number }` |
| `ExpenseUpdated` | Despesa atualizada | `{ expenseId: string, changes: Record<string, unknown> }` |
| `ExpenseSoftDeleted` | Soft delete | `{ expenseId: string, deletedAt: Date }` |

---

## Revenue

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `RevenueCreated` | Receita criada | `{ revenueId: string, amount: number, source: RevenueSource }` |
| `RevenueUpdated` | Receita atualizada | `{ revenueId: string, changes: Record<string, unknown> }` |
| `RevenueSoftDeleted` | Soft delete | `{ revenueId: string, deletedAt: Date }` |

---

## Category

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `CategoryCreated` | Categoria criada | `{ categoryId: string, name: string, type: CategoryType }` |
| `CategoryUpdated` | Categoria atualizada | `{ categoryId: string, changes: Record<string, unknown> }` |

---

## Supplier

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `SupplierCreated` | Fornecedor criado | `{ supplierId: string, name: string }` |
| `SupplierUpdated` | Fornecedor atualizado | `{ supplierId: string, changes: Record<string, unknown> }` |

---

## User

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `UserCreated` | Usuário criado | `{ userId: string, email: string, role: UserRole }` |
| `UserUpdated` | Usuário atualizado | `{ userId: string, changes: Record<string, unknown> }` |

---

## Relação com Event Bus existente

Eventos da Epic 02 **estendem** o catálogo em `packages/core/src/events`. Na implementação:

1. Adicionar nomes ao `DomainEvents`
2. Handlers registrados na inicialização da app
3. `ExpenseDetected` (Epic 05) dispara pipeline que culmina em `ExpenseCreated`

---

## Contratos de teste

Cada payload deve ter schema Zod correspondente em `@finance-ai/shared/contracts` ou `@finance-ai/core` (decisão na implementação). Testes de contrato validam serialização/deserialização.
