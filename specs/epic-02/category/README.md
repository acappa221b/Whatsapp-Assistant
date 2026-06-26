# Category — Especificação de Domínio

**Epic:** 02  
**Entidade:** Category (Categoria)  
**Versão:** 1.0.0

---

## Objetivo

Classificar despesas e receitas em categorias nomeadas, permitindo KPIs ("top categorias") e organização financeira.

---

## Definição

Uma **Category** é um rótulo único por tipo (EXPENSE ou REVENUE) usado para agrupar lançamentos. Categories não possuem soft delete no MVP — desativação é extensão futura.

---

## Campos

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `id` | `string` (cuid) | Sim | Gerado; imutável |
| `name` | `string` | Sim | Min 2 chars, max 100; trim; ver unicidade |
| `type` | `CategoryType` | Sim | Enum |

### Enum `CategoryType`

| Valor | Descrição |
|-------|-----------|
| `EXPENSE` | Categoria para despesas |
| `REVENUE` | Categoria para receitas (futuro) |

---

## Regras de Negócio

1. **Unicidade:** par `(name, type)` deve ser único (case-insensitive após trim)
2. **Nome normalizado:** espaços extras removidos; comparação case-insensitive
3. **Expense exige category EXPENSE:** validado no aggregate Expense
4. **Não deletar categoria em uso:** no MVP, bloquear delete se Expense referencia (Epic 03)
5. **Seed inicial (Epic 03):** categorias padrão EXPENSE (ex.: Alimentação, Transporte, Serviços)

---

## Invariantes

| ID | Invariante |
|----|------------|
| INV-C01 | `(name, type)` único |
| INV-C02 | `type` ∈ { EXPENSE, REVENUE } |
| INV-C03 | `name.length >= 2` após trim |

---

## Casos de Uso

| Caso de uso | Descrição |
|-------------|-----------|
| `CreateCategory` | Cria categoria |
| `UpdateCategory` | Atualiza nome (type imutável) |
| `GetCategoryById` | Busca por ID |
| `ListCategories` | Lista por type |

---

## Eventos Emitidos

| Evento | Quando | Payload |
|--------|--------|---------|
| `CategoryCreated` | Após create | `{ categoryId, name, type }` |
| `CategoryUpdated` | Após update | `{ categoryId, changes }` |

---

## Dependências

Nenhuma entidade obrigatória. Consumida por Expense.

---

## Critérios de Aceite

### CA-C01 — Criar categoria expense

- **Given** nome "Alimentação" e type EXPENSE
- **When** `CreateCategory`
- **Then** categoria criada; evento `CategoryCreated`

### CA-C02 — Rejeitar duplicata

- **Given** Category "Alimentação" EXPENSE existente
- **When** `CreateCategory` com name "alimentação" (case diff)
- **Then** erro de unicidade

### CA-C03 — Type imutável

- **Given** Category existente
- **When** `UpdateCategory` tenta alterar type
- **Then** erro; type não mutável

---

## Casos de Borda

| Cenário | Comportamento |
|---------|---------------|
| Nome 1 char | Rejeitar |
| Nome 101 chars | Rejeitar |
| Mesmo nome, types diferentes | **Permitir** ("Salário" EXPENSE vs REVENUE) |
| Caracteres especiais no nome | Permitir se length ok |

---

## Estratégia de Testes

Matriz: IDs `CAT-*` em [test-matrix.md](../test-matrix.md).
