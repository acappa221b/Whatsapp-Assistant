# Expense — Sequence Diagrams

Diagramas de sequência para casos de uso da entidade Expense (Epic 02).

---

## CreateExpense

```mermaid
sequenceDiagram
  actor Client
  participant UC as CreateExpenseUseCase
  participant Val as ExpenseValidator
  participant Cat as CategoryRepository
  participant Sup as SupplierRepository
  participant Repo as ExpenseRepository
  participant Bus as EventBus

  Client->>UC: execute(input)
  UC->>Val: validate(input)
  Val-->>UC: ok | ValidationError
  UC->>Cat: findById(categoryId)
  Cat-->>UC: Category (type=EXPENSE)
  alt supplierId provided
    UC->>Sup: findById(supplierId)
    Sup-->>UC: Supplier (active)
  end
  UC->>Repo: save(expense)
  Repo-->>UC: Expense
  UC->>Bus: publish(ExpenseCreated)
  UC-->>Client: Result<Expense>
```

---

## UpdateExpense

```mermaid
sequenceDiagram
  actor Client
  participant UC as UpdateExpenseUseCase
  participant Repo as ExpenseRepository
  participant Val as ExpenseValidator
  participant Cat as CategoryRepository
  participant Bus as EventBus

  Client->>UC: execute(id, patch)
  UC->>Repo: findById(id)
  Repo-->>UC: Expense
  alt deletedAt != null
    UC-->>Client: Error (expense deleted)
  end
  UC->>Val: validatePatch(patch)
  Val-->>UC: ok | ValidationError
  opt categoryId changed
    UC->>Cat: findById(categoryId)
    Cat-->>UC: Category (type=EXPENSE)
  end
  UC->>Repo: update(expense)
  Repo-->>UC: Expense
  UC->>Bus: publish(ExpenseUpdated)
  UC-->>Client: Result<Expense>
```

---

## SoftDeleteExpense

```mermaid
sequenceDiagram
  actor Client
  participant UC as SoftDeleteExpenseUseCase
  participant Repo as ExpenseRepository
  participant Bus as EventBus

  Client->>UC: execute(id)
  UC->>Repo: findById(id)
  Repo-->>UC: Expense
  alt already deleted
    UC-->>Client: Error (already deleted)
  end
  UC->>Repo: softDelete(id)
  Note over Repo: SET deletedAt = now()<br/>NEVER physical DELETE
  Repo-->>UC: Expense
  UC->>Bus: publish(ExpenseSoftDeleted)
  UC-->>Client: Result<void>
```

---

## ListExpenses

```mermaid
sequenceDiagram
  actor Client
  participant UC as ListExpensesUseCase
  participant Repo as ExpenseRepository

  Client->>UC: execute(filters, pagination)
  Note over UC: Default filter:<br/>deletedAt IS NULL
  UC->>Repo: findMany(filters, pagination)
  Repo-->>UC: Expense[]
  UC-->>Client: Result<PaginatedExpenses>
```

---

## Notas arquiteturais

- Repositórios são **interfaces** nesta spec; implementação Prisma na Epic 03
- Event Bus conforme ADR-002 (`InMemoryEventBus` no MVP)
- Soft delete conforme ADR-004 — repositório expõe `softDelete`, nunca `delete`
