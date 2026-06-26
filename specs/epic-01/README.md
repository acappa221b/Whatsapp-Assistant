# Epic 01 — Infraestrutura Base

**Status:** ✅ Concluída  
**Versão:** 0.0.2  
**Encerrada em:** 2025-06-22

## Objetivo

Estabelecer monorepo, configs, Docker, testes, harnesses, CI/CD, governança e documentação inicial.

## Escopo

- [x] Estrutura monorepo (pnpm + turbo)
- [x] Next.js 15 dashboard (porta 4000)
- [x] TypeScript strict
- [x] Prisma + SQLite
- [x] Vitest + Playwright
- [x] Docker Compose
- [x] Harness agents
- [x] ADRs 001–004
- [x] GitHub Actions CI
- [x] Coverage gate 90%
- [x] Husky + Commitlint
- [x] Package `@finance-ai/shared`
- [x] ROADMAP.md

## Fora de escopo

Implementação de regras de negócio, WhatsApp, IA, Excel.

## Critérios de aceite

1. [x] `pnpm install` sem erros
2. [x] `pnpm dev` sobe dashboard em localhost:4000
3. [x] `pnpm harness` passa em todos os agents
4. [x] `pnpm test:unit` executa testes base
5. [x] `pnpm test:coverage` atinge gate 90%
6. [x] `pnpm lint` + `pnpm typecheck` + `pnpm build`
7. [x] Documentação arquitetural publicada
8. [x] CI pipeline configurado

## Rastreabilidade

| Requisito | Spec | Teste | Harness |
|-----------|------|-------|---------|
| Monorepo | epic-01/README | vitest root | ArchitectureHarness |
| Event Bus | ADR-002 | event-bus.test | ArchitectureHarness |
| Prisma schema | epic-03 preview | — | DatabaseHarness |
| CI/CD | docs/deployment/ci-cd.md | — | ArchitectureHarness |
| Shared package | packages/shared/README | utils.test | ArchitectureHarness |
| Soft Delete | ADR-004 | — | ArchitectureHarness |

## Próximo passo

**Epic 02 — Domínio Financeiro** — requer spec detalhada aprovada em `specs/epic-02/`.
