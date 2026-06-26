# ADR-001: Arquitetura Geral do Finance AI Dashboard

**Status:** Aceito  
**Data:** 2025-06-22  
**Versão:** 0.0.1

## Contexto

Necessidade de um dashboard financeiro inteligente integrado ao WhatsApp, com IA, aprovação humana, auditoria e exportação Excel, mantendo o banco como fonte de verdade.

## Decisão

Adotar monorepo **pnpm + Turbo** com:

- **Frontend/Backend unificado:** Next.js 15 (App Router + Route Handlers)
- **Pacotes compartilhados:** core, database, whatsapp, ai, excel, audit
- **Domínios isolados** em `packages/core/src/domains/`
- **Spec Driven Development** com specs em `specs/epic-XX/`
- **Harness agents** para validação automatizada por área

## Alternativas consideradas

| Alternativa | Motivo rejeição |
|-------------|-----------------|
| NestJS backend separado | Stack obrigatória define Route Handlers |
| Repositório multi-repo | Complexidade desnecessária no MVP |
| Excel como fonte de verdade | Requisito explícito: DB é SoT |

## Consequências

- Desenvolvimento incremental por epics
- Transpile de pacotes internos no Next.js
- Documentação e specs obrigatórias antes de features

## Referências

- `docs/architecture/overview.md`
- Master Prompt Finance AI Dashboard
