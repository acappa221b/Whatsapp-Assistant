# Epic 02 — Domínio Financeiro

**Status:** ✅ Domínio implementado (Epic 02.5) — aguardando Epic 03 (Prisma)  
**Versão da spec:** 1.0.0  
**Depende de:** Epic 01 ✅  
**Bloqueia:** Epic 03 (Prisma), Epic 07 (Dashboard CRUD parcial)

---

## Objetivo

Especificar formalmente as entidades de domínio financeiro — Expense, Revenue, Category, Supplier e User — incluindo regras de negócio, casos de uso, eventos, critérios de aceite e matriz de testes, **sem implementação de código de produção**.

---

## Escopo desta spec

| Incluído | Excluído |
|----------|----------|
| Definição de entidades | Repositórios Prisma |
| Regras de negócio e invariantes | Migrations |
| Casos de uso | API Route Handlers |
| Eventos de domínio | UI Dashboard |
| Critérios Given/When/Then | Integração WhatsApp/IA |

---

## Estrutura

```
specs/epic-02/
├── README.md
├── test-matrix.md
├── events-catalog.md
├── adr-impact.md
├── expense/README.md + sequence-diagrams.md
├── revenue/README.md
├── category/README.md
├── supplier/README.md
└── user/README.md
```

---

## Entidades

| Entidade | Spec | Casos de uso | Soft delete |
|----------|------|--------------|-------------|
| [Expense](./expense/README.md) | ✅ | 5 | Sim (ADR-004) |
| [Revenue](./revenue/README.md) | ✅ | 5 | Sim (ADR-004) |
| [Category](./category/README.md) | ✅ | 4 | Não |
| [Supplier](./supplier/README.md) | ✅ | 5 | Sim |
| [User](./user/README.md) | ✅ | 4 | Não |

---

## Catálogo de eventos

Ver [events-catalog.md](./events-catalog.md) — 13 eventos documentados.

---

## ADRs relacionadas

Ver [adr-impact.md](./adr-impact.md).

| ADR | Impacto resumido |
|-----|------------------|
| ADR-001 | Domínios isolados em `packages/core` |
| ADR-002 | Eventos via Event Bus |
| ADR-003 | Contratos para schema futuro (Epic 03) |
| ADR-004 | Soft delete Expense/Revenue/Supplier |

---

## Matriz de testes

Ver [test-matrix.md](./test-matrix.md) — **55 casos** documentados.

---

## Critérios de aceite da Epic 02 (spec)

1. [x] README por entidade com todas as seções obrigatórias
2. [x] Matriz de testes com ID, pré-condições, entrada, resultado
3. [x] Diagramas Mermaid para Expense (Create, Update, SoftDelete, List)
4. [x] Catálogo de eventos documentado
5. [x] Harnesses de especificação verdes
6. [ ] **Aprovação formal** do Tech Lead / Arquiteto
7. [ ] Implementação (fase seguinte, pós-aprovação)

---

## Pendências para Epic 03

- Schema Prisma alinhado aos campos especificados
- Migrations SQLite + `deletedAt`
- Repositórios implementando interfaces
- Seed categorias padrão
- Enums `ExpenseSource`, `CategoryType`, `UserRole`
- Índices unicidade (Category name+type, User email, Supplier name)

---

## Rastreabilidade

| Artefato | Harness |
|----------|---------|
| Specs por entidade | `*DomainHarness` |
| Matriz + diagramas | `ExpenseDomainHarness` |
| Eventos + ADRs | `validateEpic02SharedArtifacts` |

---

## Próximo passo

1. Revisão e **aprovação formal** desta spec
2. Implementação em `packages/core/src/domains/` (pós-aprovação)
3. Testes unitários conforme matriz (SDD)
