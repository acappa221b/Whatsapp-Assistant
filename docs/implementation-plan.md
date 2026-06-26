# Plano de Implementação — Finance AI Dashboard

**Versão atual:** 0.0.1  
**Última atualização:** 2025-06-22

## Estado atual (Epic 01 — Infraestrutura Base)

Concluído nesta entrega:

- Monorepo pnpm + Turbo
- App Next.js 15 (React 19, Tailwind, Shadcn base)
- Pacotes: core, database, whatsapp, ai, excel, audit, tests
- Prisma schema inicial (SQLite)
- Docker + Compose
- Vitest + Playwright configurados
- Estrutura de domínios (stubs)
- Specs epic-01/02/03
- Harness agents (9)
- ADR-001, ADR-002, ADR-003
- Documentação arquitetural

## Sequência de Epics (não pular)

| # | Epic | Entregável principal | Depende de |
|---|------|---------------------|------------|
| 01 | Infraestrutura Base | Monorepo, CI, harness | — |
| 02 | Domínio Financeiro | Entidades + use cases | 01 |
| 03 | Banco + Prisma | Migrations + repos | 01, 02 |
| 04 | WhatsApp | Baileys provider + eventos | 01, 03 |
| 05 | IA | OpenAI structured outputs | 01, 02 |
| 06 | OCR | OpenAI Vision provider | 05 |
| 07 | Dashboard | KPIs, Recharts, CRUD UI | 02, 03 |
| 08 | Excel | generateMonthly/YearWorkbook | 03 |
| 09 | Aprovação | Fila confidence < 0.80 | 02, 03, 07 |
| 10 | Auditoria | AuditLog em toda mutação | 03 |

## Epic 01 — conclusão (v0.0.2)

1. [x] GitHub Actions CI
2. [x] Coverage gate 90%
3. [x] Husky + Commitlint
4. [x] `@finance-ai/shared`
5. [x] ADR-004 Soft Delete
6. [x] ROADMAP.md
7. [ ] Playwright no CI (Epic 07)

## Epic 02 — preparação (após spec aprovada)

1. Escrever spec detalhada com casos de teste em `specs/epic-02/`
2. Definir entidades Expense, Revenue, Category, Supplier, User
3. Implementar repositórios (interfaces) + testes unitários
4. Validar com SpecHarness + cobertura 90%

## Epic 03 — preparação

1. `prisma migrate dev` inicial
2. Seed categorias
3. Implementar Prisma repositories
4. Testes integração database

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Baileys instável | Provider interface; trocar implementação |
| Custo OpenAI | Confidence + fila aprovação |
| SQLite limites concorrência | ADR-003 path PostgreSQL |
| Cobertura 90% | Testes antes de implementar (SDD) |

## Definition of Done (por Epic)

1. Spec aprovada e casos de teste documentados
2. Implementação conforme spec
3. Harness da área verde
4. README e docs atualizados
5. PATCH version incrementada
