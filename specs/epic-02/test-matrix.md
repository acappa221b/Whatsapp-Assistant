# Matriz de Testes — Epic 02 Domínio Financeiro

**Versão:** 1.0.0  
**Total de casos:** 55

Legenda: `SPEC` = especificado; implementação pendente.

---

## Expense

| ID | Descrição | Pré-condições | Entrada | Resultado esperado | Status |
|----|-----------|---------------|---------|-------------------|--------|
| EXP-001 | Criar despesa manual válida | Category EXPENSE ativa | amount=100.50, description="Almoço", source=MANUAL, date=hoje, categoryId | Expense criada, confidence=1.0, ExpenseCreated | SPEC |
| EXP-002 | Rejeitar amount zero | Category válida | amount=0 | ValidationError | SPEC |
| EXP-003 | Rejeitar amount negativo | Category válida | amount=-50 | ValidationError | SPEC |
| EXP-004 | Rejeitar description vazia | Category válida | description="   " | ValidationError | SPEC |
| EXP-005 | Rejeitar category REVENUE | Category type=REVENUE | categoryId dessa category | ValidationError | SPEC |
| EXP-006 | Rejeitar category inexistente | — | categoryId="invalid" | NotFoundError | SPEC |
| EXP-007 | Criar com supplier válido | Category + Supplier ativos | supplierId válido | Expense com supplierId | SPEC |
| EXP-008 | Rejeitar supplier deletado | Supplier deletedAt != null | supplierId desse supplier | ValidationError | SPEC |
| EXP-009 | Confidence OCR default | — | source=OCR, sem confidence | confidence=0.5 | SPEC |
| EXP-010 | Rejeitar confidence inválida | — | confidence=1.5 | ValidationError | SPEC |
| EXP-011 | Update despesa ativa | Expense ativa | patch description, amount | Updated, ExpenseUpdated | SPEC |
| EXP-012 | Rejeitar update deletada | Expense deletedAt != null | qualquer patch | Error | SPEC |
| EXP-013 | Soft delete despesa | Expense ativa | id | deletedAt set, ExpenseSoftDeleted | SPEC |
| EXP-014 | Rejeitar soft delete duplicado | Expense já deletada | id | Error | SPEC |
| EXP-015 | Get by id existente | Expense ativa | id | Expense retornada | SPEC |
| EXP-016 | Get include deleted | Expense deletada | id, includeDeleted=true | Expense retornada | SPEC |
| EXP-017 | List exclui deletadas | 3 ativas, 1 deletada | filtro padrão | 3 items | SPEC |
| EXP-018 | List filtro por category | mix categories | categoryId filter | subset correto | SPEC |
| EXP-019 | List paginação | 25 expenses | page=2, limit=10 | 10 items page 2 | SPEC |
| EXP-020 | Rejeitar date futura | — | date=+30 dias | ValidationError | SPEC |

---

## Revenue

| ID | Descrição | Pré-condições | Entrada | Resultado esperado | Status |
|----|-----------|---------------|---------|-------------------|--------|
| REV-001 | Criar receita válida | — | amount=5000, description="Venda", source=MANUAL, date=hoje | RevenueCreated | SPEC |
| REV-002 | Rejeitar amount negativo | — | amount=-1 | ValidationError | SPEC |
| REV-003 | Rejeitar description vazia | — | description="" | ValidationError | SPEC |
| REV-004 | Update receita ativa | Revenue ativa | patch amount | RevenueUpdated | SPEC |
| REV-005 | Rejeitar update deletada | Revenue deletada | patch | Error | SPEC |
| REV-006 | Soft delete receita | Revenue ativa | id | RevenueSoftDeleted | SPEC |
| REV-007 | Get by id | Revenue existe | id | Revenue | SPEC |
| REV-008 | List exclui deletadas | 2 ativas, 1 deletada | padrão | 2 items | SPEC |

---

## Category

| ID | Descrição | Pré-condições | Entrada | Resultado esperado | Status |
|----|-----------|---------------|---------|-------------------|--------|
| CAT-001 | Criar category EXPENSE | — | name="Alimentação", type=EXPENSE | CategoryCreated | SPEC |
| CAT-002 | Rejeitar duplicata case-insensitive | "Alimentação" EXPENSE existe | name="alimentação" | ValidationError | SPEC |
| CAT-003 | Permitir mesmo nome types diferentes | "Salário" REVENUE existe | name="Salário", type=EXPENSE | CategoryCreated | SPEC |
| CAT-004 | Rejeitar nome curto | — | name="A" | ValidationError | SPEC |
| CAT-005 | Update nome | Category existe | name="Transporte" | CategoryUpdated | SPEC |
| CAT-006 | Rejeitar update type | Category existe | type=REVENUE | Error (immutable) | SPEC |
| CAT-007 | Get by id | Category existe | id | Category | SPEC |
| CAT-008 | List por type | mix EXPENSE/REVENUE | type=EXPENSE | só EXPENSE | SPEC |

---

## Supplier

| ID | Descrição | Pré-condições | Entrada | Resultado esperado | Status |
|----|-----------|---------------|---------|-------------------|--------|
| SUP-001 | Criar supplier sem document | — | name="Padaria Central" | SupplierCreated | SPEC |
| SUP-002 | Rejeitar nome duplicado | "Padaria" ativo | name="padaria" | ValidationError | SPEC |
| SUP-003 | Criar com document sem validação MVP | — | document="12345678901" | Aceito | SPEC |
| SUP-004 | Update supplier | Supplier ativo | name, document | SupplierUpdated | SPEC |
| SUP-005 | Soft delete supplier | Supplier ativo | id | deletedAt set | SPEC |
| SUP-006 | Rejeitar update deletado | Supplier deletado | patch | Error | SPEC |
| SUP-007 | Get by id | Supplier existe | id | Supplier | SPEC |
| SUP-008 | List exclui deletados | 2 ativos, 1 deletado | padrão | 2 items | SPEC |

---

## User

| ID | Descrição | Pré-condições | Entrada | Resultado esperado | Status |
|----|-----------|---------------|---------|-------------------|--------|
| USR-001 | Criar user VIEWER | — | name, email, role=VIEWER | UserCreated | SPEC |
| USR-002 | Rejeitar email duplicado | email existente | mesmo email | ValidationError | SPEC |
| USR-003 | Normalizar email lowercase | — | email="User@Test.COM" | stored user@test.com | SPEC |
| USR-004 | Rejeitar email inválido | — | email="not-email" | ValidationError | SPEC |
| USR-005 | Update user role | User existe | role=MANAGER | UserUpdated | SPEC |
| USR-006 | Rejeitar role inválido | — | role=SUPERUSER | ValidationError | SPEC |
| USR-007 | Get by id | User existe | id | User | SPEC |
| USR-008 | List users ADMIN only | caller ADMIN | — | lista users | SPEC |
| USR-009 | VIEWER cannot create expense | user VIEWER | CreateExpense | PermissionDenied | SPEC |
| USR-010 | MANAGER can create expense | user MANAGER | CreateExpense | Permitido | SPEC |
| USR-011 | VIEWER read-only list | user VIEWER | ListExpenses | Permitido | SPEC |

---

## Resumo

| Entidade | Casos |
|----------|-------|
| Expense | 20 |
| Revenue | 8 |
| Category | 8 |
| Supplier | 8 |
| User | 11 |
| **Total** | **55** |
