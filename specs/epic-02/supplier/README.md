# Supplier — Especificação de Domínio

**Epic:** 02  
**Entidade:** Supplier (Fornecedor)  
**Versão:** 1.0.0

---

## Objetivo

Identificar fornecedores associados a despesas, habilitando KPI "top fornecedores" e rastreabilidade de gastos.

---

## Definição

Um **Supplier** representa pessoa física ou jurídica que fornece produtos/serviços. Possui soft delete (consistente com ADR-004 para entidades financeiras relacionadas).

---

## Campos

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `id` | `string` (cuid) | Sim | Gerado; imutável |
| `name` | `string` | Sim | Min 2 chars, max 200; trim |
| `document` | `string \| null` | Não | CPF ou CNPJ; validação futura |
| `createdAt` | `Date` | Sim | Auto |
| `updatedAt` | `Date` | Sim | Auto |
| `deletedAt` | `Date \| null` | Sim | Soft delete |

---

## Regras de Negócio

1. **Nome obrigatório** e único entre suppliers ativos (case-insensitive)
2. **Soft delete:** `deletedAt` em vez de DELETE físico
3. **Document opcional** no MVP
4. **Validação CPF/CNPJ (futuro):**
   - CPF: 11 dígitos, checksum válido
   - CNPJ: 14 dígitos, checksum válido
   - Armazenar apenas dígitos (sem pontuação)
   - **Epic 02:** documentar apenas; **não implementar** validação
5. **Supplier deletado:** não pode ser associado a novas Expenses
6. **Expenses existentes** mantêm referência histórica ao supplier deletado

---

## Invariantes

| ID | Invariante |
|----|------------|
| INV-S01 | `name` único entre ativos |
| INV-S02 | `deletedAt === null` para supplier "ativo" |
| INV-S03 | `document` null ou string normalizada (futuro) |

---

## Casos de Uso

| Caso de uso | Descrição |
|-------------|-----------|
| `CreateSupplier` | Cria fornecedor |
| `UpdateSupplier` | Atualiza nome/document |
| `SoftDeleteSupplier` | Soft delete |
| `GetSupplierById` | Busca por ID |
| `ListSuppliers` | Lista ativos com paginação |

---

## Eventos Emitidos

| Evento | Quando | Payload |
|--------|--------|---------|
| `SupplierCreated` | Após create | `{ supplierId, name }` |
| `SupplierUpdated` | Após update | `{ supplierId, changes }` |

> Soft delete de Supplier **não** emite evento de domínio separado no MVP; mutação registrada via AuditLog (Epic 10).

---

## Dependências

Consumida opcionalmente por Expense.

---

## Critérios de Aceite

### CA-S01 — Criar supplier sem document

- **Given** name "Padaria Central"
- **When** `CreateSupplier`
- **Then** supplier criado; evento `SupplierCreated`

### CA-S02 — Rejeitar nome duplicado

- **Given** supplier "Padaria Central" ativo
- **When** `CreateSupplier` com "padaria central"
- **Then** erro unicidade

### CA-S03 — Soft delete

- **Given** supplier ativo sem expenses pendentes de validação
- **When** `SoftDeleteSupplier`
- **Then** `deletedAt` preenchido; excluído de listagens padrão

---

## Casos de Borda

| Cenário | Comportamento |
|---------|---------------|
| `document` com pontuação | Aceitar no MVP; normalização Epic futura |
| `document` CPF inválido | **Aceitar no MVP** (validação documentada, não implementada) |
| Update supplier deletado | Rejeitar |
| Nome vazio | Rejeitar |

---

## Validação CPF/CNPJ (documentação futura)

| Tipo | Formato armazenado | Validação |
|------|-------------------|-----------|
| CPF | 11 dígitos | Dígitos verificadores (Epic futura) |
| CNPJ | 14 dígitos | Dígitos verificadores (Epic futura) |

---

## Estratégia de Testes

Matriz: IDs `SUP-*` em [test-matrix.md](../test-matrix.md).
