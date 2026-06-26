# Roadmap — WhatsApp Assistant

**Versão:** 1.0.0-planning  
**Última atualização:** 2025-06-25  
**Status:** Planejamento aprovado — implementação pendente

> **Pivot de produto:** este roadmap substitui o roadmap Finance AI. Epics financeiras estão **DEPRECATED**. Ver [docs/refactor/deprecated-modules.md](docs/refactor/deprecated-modules.md).

---

## Visão

Capturar, organizar, indexar e compreender conversas WhatsApp para memória conversacional de longo prazo.

Documentação: [docs/product/vision.md](docs/product/vision.md)

---

## Fase 0 — Planejamento ✅ (ATUAL)

| Entregável | Status |
|------------|--------|
| Visão do produto | ✅ |
| Plano de migração | ✅ |
| Módulos deprecated | ✅ |
| Arquitetura Assistant | ✅ |
| Epic Assistant-01 (spec) | ✅ |
| Spec Relatórios (sem impl) | ✅ |
| Doc Whisper | ✅ |
| ADR-009 | ✅ |
| Harnesses spec | ✅ |

**Gate:** aprovação formal → inicia Fase 1

---

## Fase 1 — Assistant-01: Message Archive

**Epic:** [specs/epic-assistant-01/](specs/epic-assistant-01/README.md)

### Assistant-01A — Rebranding ✅

- [x] Tema escuro neon + sidebar lateral
- [x] APP_NAME / metadata WhatsApp Assistant
- [x] Redirect `/` → `/dashboard`
- [x] Menu 4 itens (deprecated ocultos)
- [x] Sumário com placeholders
- [x] Relatórios placeholder

Release: [docs/releases/assistant-01a.md](docs/releases/assistant-01a.md)

### Assistant-01B+ (pendente)

Implementação **sequencial** (1 feature por vez):

1. Renaming + redirect `/` → `/dashboard` + menu 4 itens ✅ (Assistant-01A)
2. Message capture hardening (unwrap, dedup, participants)
3. Audio download + Whisper transcription
4. UI Mensagens (inbox + histórico + busca)
5. UI WhatsApp (status expandido)
6. UI Sumário (6 widgets)
7. Retenção 60 dias
8. Ocultar rotas financeiras deprecated

**Meta versão:** v1.0.0-assistant

---

## Fase 2 — Relatórios Diários

**Spec:** [specs/epic-assistant-01/reports-module-spec.md](specs/epic-assistant-01/reports-module-spec.md)

- Model `DailyReport` (retenção permanente)
- Job geração diária
- UI Relatórios funcional
- Filtros: dia, usuário, grupo

**Epic proposta:** Assistant-02

---

## Fase 3 — Remoção legado financeiro

Seguir [docs/refactor/migration-plan.md](docs/refactor/migration-plan.md) Fase 3.

- Drop models: Expense, Revenue, Category, Supplier, Extraction, ApprovalQueue
- Remover packages: excel, domínios financeiros core
- Limpar harnesses epic-02/05/06/07/08

---

## Fase 4 — Produção

- PostgreSQL (ADR-003)
- Deploy Railway
- Rename pacotes `@finance-ai/*` → `@whatsapp-assistant/*` (opcional)
- Observabilidade

---

## Fase 5 — IA conversacional (futuro)

Fora de escopo atual:

- Agente que responde como usuário
- Memória ativa / RAG
- Relatórios inteligentes com LLM

---

## Epics legadas (DEPRECATED)

| Epic | Status |
|------|--------|
| epic-01 | Infra — reutilizar patterns |
| epic-02 | 🔴 DEPRECATED |
| epic-03 | 🟡 Parcial — Prisma patterns |
| epic-04 | 🟢 Absorvida por Assistant-01 |
| epic-05 | 🔴 DEPRECATED |
| epic-06 | 🔴 DEPRECATED |
| epic-07 | 🔴 DEPRECATED |
| epic-08 | 🔴 DEPRECATED |

---

## Princípios

1. **1 feature por vez**
2. **1 epic por vez**
3. **1 validação por vez**
4. Spec antes de código
5. Harness verde antes de merge
