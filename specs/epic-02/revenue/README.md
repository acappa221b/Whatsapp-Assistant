# Revenue — Especificação de Domínio

**Epic:** 02  
**Entidade:** Revenue (Receita)  
**Versão:** 1.0.0

---

## Objetivo

Representar um lançamento de receita financeira. Revenue captura entradas de valor no sistema, complementando Expense para cálculo de lucro e KPIs.

---

## Definição

Uma **Revenue** registra uma entrada financeira com descrição, valor, data e origem. Assim como Expense, receitas obedecem soft delete obrigatório (ADR-004) e são auditáveis.

---

## Campos

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `id` | `string` (cuid) | Sim | Gerado pelo sistema; imutável |
| `description` | `string` | Sim | Min 1 char, max 500 chars; trim |
| `amount` | `number` (decimal) | Sim | `> 0`; max 2 casas decimais |
| `date` | `Date` | Sim | Data da receita; não futura > 1 dia |
| `source` | `RevenueSource` | Sim | Enum — reutiliza valores de ExpenseSource aplicáveis |
| `createdAt` | `Date` | Sim | Auto; imutável |
| `updatedAt` | `Date` | Sim | Auto |
| `deletedAt` | `Date \| null` | Sim | Soft delete (ADR-004) |

### Enum `RevenueSource`

Mesmos valores de `ExpenseSource`: `MANUAL`, `WHATSAPP_TEXT`, `WHATSAPP_IMAGE`, `OCR`, `IMPORT`.

> Revenue não possui `categoryId` nem `supplierId` no MVP. Categorização de receita via Category (`type = REVENUE`) é extensão futura (Epic 07+).

---

## Regras de Negócio

1. **Valor positivo:** `amount > 0`
2. **Soft delete obrigatório** (ADR-004)
3. **Data obrigatória**
4. **Auditoria:** toda criação, atualização e soft delete deve gerar registro em AuditLog (Epic 10); na Epic 02, eventos de domínio prepara o contrato
5. **Receita deletada:** excluída de listagens e KPIs padrão
6. **Receita deletada:** não pode ser atualizada no MVP

---

## Invariantes

| ID | Invariante |
|----|------------|
| INV-R01 | `amount > 0` sempre |
| INV-R02 | `deletedAt === null` para receita "ativa" |
| INV-R03 | `id` imutável |
| INV-R04 | `createdAt <= updatedAt` |

---

## Casos de Uso

| Caso de uso | Descrição |
|-------------|-----------|
| `CreateRevenue` | Cria nova receita |
| `UpdateRevenue` | Atualiza receita ativa |
| `SoftDeleteRevenue` | Soft delete |
| `GetRevenueById` | Busca por ID |
| `ListRevenues` | Lista com filtros e paginação |

---

## Eventos Emitidos

| Evento | Quando | Payload mínimo |
|--------|--------|------------------|
| `RevenueCreated` | Após `CreateRevenue` | `{ revenueId, amount, source }` |
| `RevenueUpdated` | Após `UpdateRevenue` | `{ revenueId, changes }` |
| `RevenueSoftDeleted` | Após `SoftDeleteRevenue` | `{ revenueId, deletedAt }` |

---

## Dependências

| Entidade | Tipo | Motivo |
|----------|------|--------|
| User | Indireta | Actor em auditoria (Epic 10) |

---

## Critérios de Aceite

### CA-R01 — Criar receita válida

- **Given** input válido com `amount = 5000`, `source = MANUAL`
- **When** `CreateRevenue` executado
- **Then** receita persistida, `deletedAt = null`, evento `RevenueCreated` emitido

### CA-R02 — Rejeitar amount negativo

- **Given** `amount = -100`
- **When** `CreateRevenue` executado
- **Then** erro de validação

### CA-R03 — Soft delete com auditoria (contrato)

- **Given** Revenue ativa
- **When** `SoftDeleteRevenue` executado
- **Then** `deletedAt` preenchido; evento `RevenueSoftDeleted` emitido (AuditLog na Epic 10)

### CA-R04 — Listar excluindo deletadas

- **Given** 2 ativas, 1 deletada
- **When** `ListRevenues` padrão
- **Then** retorna 2

---

## Casos de Borda

| Cenário | Comportamento |
|---------|---------------|
| `description` vazia | Rejeitar |
| `amount = 0.01` | Aceitar (mínimo) |
| `date` inválida (Invalid Date) | Rejeitar |
| Update em receita deletada | Rejeitar |
| `source` enum inválido | Rejeitar |

---

## Estratégia de Testes

| Camada | Escopo |
|--------|--------|
| Unitários | Entidade, validadores, use cases |
| Integração | Repository (Epic 03) |
| Contratos | Eventos Revenue* |

Matriz: IDs `REV-*` em [test-matrix.md](../test-matrix.md).
