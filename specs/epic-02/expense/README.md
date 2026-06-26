# Expense — Especificação de Domínio

**Epic:** 02  
**Entidade:** Expense (Despesa)  
**Versão:** 1.0.0

---

## Objetivo

Representar um lançamento de despesa financeira no sistema. Expense é a entidade central de captura de gastos, seja por entrada manual, WhatsApp, OCR ou importação.

---

## Definição

Uma **Expense** registra um gasto identificado por descrição, valor, categoria, fornecedor opcional, data, origem e nível de confiança (quando originada por IA). Despesas são imutáveis via exclusão física — apenas soft delete (ADR-004).

---

## Campos

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `id` | `string` (cuid) | Sim | Gerado pelo sistema; imutável |
| `description` | `string` | Sim | Min 1 char, max 500 chars; trim aplicado |
| `amount` | `number` (decimal) | Sim | `> 0`; max 2 casas decimais |
| `categoryId` | `string` | Sim | FK Category; tipo deve ser `EXPENSE` |
| `supplierId` | `string` | Não | FK Supplier; se informado, supplier ativo |
| `date` | `Date` | Sim | Data do gasto; não pode ser futura > 1 dia (tolerância fuso) |
| `source` | `ExpenseSource` | Sim | Enum — ver abaixo |
| `confidence` | `number` | Sim | `0.0` – `1.0`; default `1.0` para MANUAL |
| `createdAt` | `Date` | Sim | Auto; imutável |
| `updatedAt` | `Date` | Sim | Auto; atualizado a cada mutação |
| `deletedAt` | `Date \| null` | Sim | `null` = ativo; soft delete (ADR-004) |

### Enum `ExpenseSource`

| Valor | Descrição |
|-------|-----------|
| `MANUAL` | Criado manualmente no dashboard/API |
| `WHATSAPP_TEXT` | Extraído de mensagem de texto WhatsApp |
| `WHATSAPP_IMAGE` | Extraído de imagem enviada via WhatsApp |
| `OCR` | Processado por OCR (nota fiscal) |
| `IMPORT` | Importação em lote (futuro) |

---

## Regras de Negócio

1. **Valor positivo:** `amount > 0`
2. **Categoria obrigatória:** `categoryId` deve referenciar Category com `type = EXPENSE`
3. **Soft delete obrigatório:** remoção seta `deletedAt`; nunca DELETE físico (ADR-004)
4. **Data obrigatória:** `date` não pode ser nula
5. **Confidence:** entre `0` e `1` inclusive
6. **Confidence por source:**
   - `MANUAL` → confidence default `1.0`
   - `WHATSAPP_*`, `OCR`, `IMPORT` → confidence definido pela IA (Epic 05); se ausente, `0.5`
7. **Despesa deletada:** não aparece em listagens padrão (`deletedAt IS NULL`)
8. **Despesa deletada:** não pode ser atualizada (exceto restore futuro — fora do MVP)
9. **Supplier opcional:** se `supplierId` informado, supplier deve existir e `deletedAt IS NULL`

---

## Invariantes

| ID | Invariante |
|----|------------|
| INV-E01 | `amount > 0` sempre |
| INV-E02 | `confidence >= 0 && confidence <= 1` sempre |
| INV-E03 | `deletedAt === null` para despesa considerada "ativa" |
| INV-E04 | `categoryId` referencia Category válida e ativa |
| INV-E05 | `id` nunca muda após criação |
| INV-E06 | `createdAt <= updatedAt` sempre |

---

## Casos de Uso

| Caso de uso | Descrição |
|-------------|-----------|
| `CreateExpense` | Cria nova despesa validando regras |
| `UpdateExpense` | Atualiza campos mutáveis de despesa ativa |
| `SoftDeleteExpense` | Marca `deletedAt = now()` |
| `GetExpenseById` | Retorna despesa por ID (inclui opção `includeDeleted`) |
| `ListExpenses` | Lista despesas com filtros e paginação |

---

## Eventos Emitidos

| Evento | Quando | Payload mínimo |
|--------|--------|------------------|
| `ExpenseCreated` | Após `CreateExpense` sucesso | `{ expenseId, amount, categoryId, source, confidence }` |
| `ExpenseUpdated` | Após `UpdateExpense` sucesso | `{ expenseId, changes: Record<string, unknown> }` |
| `ExpenseSoftDeleted` | Após `SoftDeleteExpense` sucesso | `{ expenseId, deletedAt }` |

> Eventos publicados via Event Bus (ADR-002). Nomes alinhados ao catálogo em [events-catalog.md](../events-catalog.md).

---

## Dependências

| Entidade | Tipo | Motivo |
|----------|------|--------|
| Category | Obrigatória | Classificação do gasto |
| Supplier | Opcional | Identificação do fornecedor |
| User | Indireta | Actor em auditoria (Epic 10) |

---

## Critérios de Aceite

### CA-E01 — Criar despesa manual válida

- **Given** uma Category ativa com `type = EXPENSE`
- **When** `CreateExpense` é chamado com `amount = 100.50`, `description = "Almoço"`, `source = MANUAL`, `date = hoje`
- **Then** despesa é persistida com `confidence = 1.0`, `deletedAt = null` e evento `ExpenseCreated` é emitido

### CA-E02 — Rejeitar valor zero ou negativo

- **Given** dados válidos exceto `amount = 0`
- **When** `CreateExpense` é executado
- **Then** retorna erro de validação; nenhum evento emitido

### CA-E03 — Rejeitar categoria de receita

- **Given** Category com `type = REVENUE`
- **When** `CreateExpense` referencia essa categoryId
- **Then** retorna erro de validação

### CA-E04 — Soft delete

- **Given** Expense ativa existente
- **When** `SoftDeleteExpense` é executado
- **Then** `deletedAt` é preenchido; evento `ExpenseSoftDeleted` emitido; registro permanece no storage

### CA-E05 — Listar sem deletadas

- **Given** 3 despesas ativas e 1 soft deleted
- **When** `ListExpenses` com filtro padrão
- **Then** retorna 3 despesas

### CA-E06 — Atualizar despesa ativa

- **Given** Expense ativa
- **When** `UpdateExpense` altera `description` e `amount`
- **Then** campos atualizados, `updatedAt` refresh, evento `ExpenseUpdated` emitido

### CA-E07 — Bloquear update em deletada

- **Given** Expense com `deletedAt != null`
- **When** `UpdateExpense` é executado
- **Then** retorna erro; nenhuma mutação

---

## Casos de Borda

| Cenário | Comportamento esperado |
|---------|------------------------|
| `amount = 0.001` | Rejeitar (mínimo 0.01) |
| `amount = 999999999.99` | Aceitar (limite superior documentado) |
| `description` vazia ou só espaços | Rejeitar após trim |
| `description` > 500 chars | Rejeitar |
| `confidence = -0.1` ou `1.1` | Rejeitar |
| `date` no futuro distante | Rejeitar |
| `categoryId` inexistente | Rejeitar |
| `supplierId` de supplier deletado | Rejeitar |
| Duplicata lógica (mesmo valor/data/descrição) | **Permitir** no MVP (dedup é Epic futura) |
| `source = OCR` sem confidence | Default `0.5` |

---

## Estratégia de Testes

| Camada | Escopo | Ferramenta |
|--------|--------|------------|
| **Unitários** | Entidade Expense, validadores, casos de uso | Vitest |
| **Integração** | Repositório + banco (Epic 03) | Vitest + SQLite temp |
| **Contratos** | Formato eventos `ExpenseCreated/Updated/SoftDeleted` | Vitest + schema Zod |

### Cobertura alvo

- 100% dos validadores de Expense
- 100% dos casos de uso
- Cenários da matriz [test-matrix.md](../test-matrix.md) IDs `EXP-*`

---

## Diagramas

Ver [sequence-diagrams.md](./sequence-diagrams.md).
