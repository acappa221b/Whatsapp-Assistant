# Impacto das ADRs na Epic 02

Referência obrigatória para implementação do domínio financeiro.

---

## ADR-001 — Arquitetura Geral

**Arquivo:** [docs/adr/001-general-architecture.md](../../docs/adr/001-general-architecture.md)

### Impacto

- Entidades vivem em `packages/core/src/domains/{entity}/`
- Estrutura por domínio: `application/`, `domain/`, `infrastructure/`, `tests/`
- Tipos utilitários (`SoftDeletable`, `Result`) em `@finance-ai/shared`
- Specs em `specs/epic-02/` são fonte de verdade antes do código

### Decisões derivadas Epic 02

| Decisão | Justificativa ADR-001 |
|---------|----------------------|
| 5 domínios isolados | Modularidade |
| Interfaces de repositório em `domain/` | Desacoplamento |
| Zero lógica em Route Handlers | Separação camadas (Epic 07) |

---

## ADR-002 — Event Driven Architecture

**Arquivo:** [docs/adr/002-event-driven-architecture.md](../../docs/adr/002-event-driven-architecture.md)

### Impacto

- Casos de uso **publicam eventos** após mutação bem-sucedida
- Nomenclatura: `{Entity}{Action}` (ex.: `ExpenseCreated`)
- Event Bus: `InMemoryEventBus` no MVP
- Handlers não acoplam domínios diretamente

### Decisões derivadas Epic 02

| Decisão | Detalhe |
|---------|---------|
| 13 eventos catalogados | Ver [events-catalog.md](./events-catalog.md) |
| Use cases injetam `EventBus` | Dependency injection |
| Falha ao publicar evento | Log + não reverter transação (at-least-once futuro) |

---

## ADR-003 — SQLite MVP + PostgreSQL Future

**Arquivo:** [docs/adr/003-sqlite-postgresql.md](../../docs/adr/003-sqlite-postgresql.md)

### Impacto na Epic 02

- Epic 02 define **contratos** (entidades, repositórios interfaces)
- **Nenhuma** implementação Prisma nesta epic
- Campos e enums documentados alinham schema futuro Epic 03
- Tipos `Date` no domínio; conversão na camada infrastructure

### Decisões derivadas Epic 02

| Decisão | Detalhe |
|---------|---------|
| IDs como `string` (cuid) | Compatível Prisma |
| Decimais como `number` no domínio | Prisma `Decimal` na infra |
| Enums como union types TypeScript | Mapeamento Prisma enum Epic 03 |

---

## ADR-004 — Soft Delete

**Arquivo:** [docs/adr/004-soft-delete.md](../../docs/adr/004-soft-delete.md)

### Impacto

| Entidade | Soft delete |
|----------|-------------|
| Expense | **Obrigatório** |
| Revenue | **Obrigatório** |
| Supplier | **Obrigatório** |
| Category | Não (MVP) |
| User | Não (MVP) |

### Decisões derivadas Epic 02

| Decisão | Detalhe |
|---------|---------|
| Use case `SoftDelete*` | Nunca `Delete*` |
| Repositório: `softDelete(id)` | Interface proíbe `delete(id)` |
| Listagens default | Filtro `deletedAt IS NULL` |
| Tipo `SoftDeletable` | `@finance-ai/shared/types` |
| Eventos `*SoftDeleted` | Expense e Revenue |

---

## Matriz ADR × Entidade

| Entidade | ADR-001 | ADR-002 | ADR-003 | ADR-004 |
|----------|---------|---------|---------|---------|
| Expense | domain/ | 3 eventos | contrato | deletedAt |
| Revenue | domain/ | 3 eventos | contrato | deletedAt |
| Category | domain/ | 2 eventos | contrato | — |
| Supplier | domain/ | 2 eventos | contrato | deletedAt |
| User | domain/ | 2 eventos | contrato | — |
