# WhatsApp Assistant

**Versão:** 1.2.0-rc11  
**Fase:** RC-11 Dashboard, tokens, relatórios, permissões v2  
**Porta padrão:** [http://localhost:4000](http://localhost:4000)

Assistente de memória conversacional via WhatsApp — captura, organização, indexação e transcrição de conversas para histórico de longo prazo.

> **Pivot de produto (2025-06-25):** este repositório deixa de ser *Finance AI Dashboard*. Ver [ADR-009](docs/adr/009-product-pivot-whatsapp-assistant.md).

---

## Objetivo

- Capturar **todas** as mensagens, chats, grupos e usuários
- Transcrever **todos** os áudios (Whisper)
- Exibir arquivo consultável (Mensagens)
- Sumário com métricas (Dashboard)
- Retenção 60 dias (mensagens); relatórios permanentes (Fase 2)
- **IA conversacional (RC-10):** resposta automática OpenAI; **RC-10B:** skip em acks, anti-repetição, sem convites

---

## Documentação principal

| Documento | Descrição |
|-----------|-----------|
| [Visão do produto](docs/product/vision.md) | Objetivos e métricas |
| [Arquitetura Assistant](docs/architecture/assistant-overview.md) | Diagrama e camadas |
| [Plano de migração](docs/refactor/migration-plan.md) | Fases 0–4 |
| [Módulos deprecated](docs/refactor/deprecated-modules.md) | O que será removido |
| [Epic Assistant-01](specs/epic-assistant-01/README.md) | Spec implementação |
| [Whisper / Transcrição](docs/whisper/transcription.md) | Pipeline áudio |
| [Roadmap](ROADMAP.md) | Marcos do produto |

---

## Menu (aplicação)

| Rota | Nome |
|------|------|
| `/dashboard/permissions` | **Permissões** (governança por chat) |
| `/dashboard` | Sumário |
| `/dashboard/messages` | Mensagens (somente chats com `archiveEnabled`) |
| `/dashboard/whatsapp` | WhatsApp |
| `/dashboard/reports` | Relatórios (placeholder Fase 1) |

Redirect: `/` → `/dashboard` · `/dashboard/chats` → `/dashboard/permissions`

---

## Dados locais (não versionados)

Estes paths existem apenas na máquina de desenvolvimento — **nunca** entram no Git:

| Path | Conteúdo |
|------|----------|
| `storage/whatsapp/` | Sessão Baileys (`creds.json`, keys, sessions) |
| `storage/media/` | Fotos, áudios e relatórios por chat |
| `storage/temp/` | Arquivos temporários |
| `packages/database/prisma/dev.db` | Banco SQLite com mensagens |
| `backups/` | Backups locais |
| `.env` | Secrets (API keys, tokens) |

Após clone: copiar `.env.example` → `.env` e rodar `pnpm db:migrate`.

Validação: `pnpm validate:repo-hygiene` (também roda no CI).

### Governança por chat (RC-08B)

| Switch | Campo | Efeito |
|--------|-------|--------|
| **Habilitado** | `archiveEnabled` | Chat visível em Mensagens |
| **IA** | `aiProcessingEnabled` | Pipeline de processamento/análise (requer Habilitado) |
| **Resposta IA** | `agentChatEnabled` | Respostas automáticas no WhatsApp via OpenAI (requer Habilitado + IA) |
| **#N** | `displayNumber` | ID estável do chat em Permissões e Mensagens |
| **Lixeira** | — | Apaga mensagens + mídia; desabilita flags; chat permanece em Permissões |

A captura Baileys **não** é filtrada por Habilitado — mensagens continuam no banco; só a visualização e IA são governadas.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, Recharts |
| Backend | Next.js Route Handlers |
| Banco | Prisma ORM, SQLite (MVP) → PostgreSQL |
| WhatsApp | Baileys |
| Transcrição | OpenAI Whisper |
| Testes | Vitest, Playwright, Harnesses |

### Banco de dados (dev)

Após pull com mudanças em `schema.prisma`:

```bash
pnpm db:migrate && pnpm db:generate
```

Reinicie o dev server após `db:generate`. Se `db:generate` falhar com `EPERM`, pare o `pnpm dev` primeiro (o engine Prisma fica bloqueado). Ver [prisma-fromme-client-desync](docs/investigations/prisma-fromme-client-desync.md).

---

## Governança SDD

- Specs em `specs/epic-assistant-01/`
- Harnesses em `harness/epic-assistant-01/`
- ADRs em `docs/adr/`
- **Regra:** 1 feature · 1 epic · 1 validação por vez

```bash
pnpm harness   # inclui Assistant01SpecHarness + PlanningHarness
```

---

## Estrutura de pastas

```
apps/dashboard/              # Next.js (UI + API)
packages/
  whatsapp/                  # Baileys ingest
  core/                      # Domínios (assistant + deprecated finance)
  database/                  # Prisma
  shared/                    # Config (APP_NAME → WhatsApp Assistant)
  ai/                        # Whisper (Fase 1); OCR financeiro DEPRECATED
specs/
  epic-assistant-01/         # Spec ATIVA
  epic-XX/                   # Legado DEPRECATED
docs/
  product/ refactor/ whisper/ architecture/
harness/
  epic-assistant-01/
```

---

## Legado Finance AI (DEPRECATED)

Módulos financeiros **não removidos ainda** — marcados deprecated:

Expense, Revenue, Category, Supplier, Pipeline, Extrações, Aprovações, Excel, OCR financeiro.

Detalhes: [docs/refactor/deprecated-modules.md](docs/refactor/deprecated-modules.md)

---

## Quick start (código atual — pré-Assistant)

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

Abrir [http://localhost:4000/dashboard/whatsapp](http://localhost:4000/dashboard/whatsapp) para conectar.

---

## Próximo passo

**Assistant-01C** — Whisper / transcrição de áudios. **RC-10** entregou `#N` por chat e resposta automática IA (OpenAI).

---

## Limitações atuais

- Auto-reply apenas mensagens TEXT (IMAGE/AUDIO ignorados em v1)
- DELETE histórico não remove embeddings/RAG (futuro)
- Sem autenticação multi-usuário

---

## Histórico de versões (README)

| Versão | Descrição |
|--------|-----------|
| 1.2.0-rc11 | RC-11: dashboard real, token ledger, relatórios diários, permissões v2, fix saudações, header status |
| 1.1.1-rc10b | RC-10B: skip ack/status, anti-repetição, anti-convite na resposta IA |
| 1.1.0-rc10 | RC-10: `#N` por chat, Resposta IA (OpenAI), `sendMessage` Baileys, takeover/deferral |
| 1.0.9-rc09 | RC-09: nomes confiáveis, mídia por chat, delete recursivo, reset geral |
| 1.0.8-rc08b | RC-08B: Permissões, `archiveEnabled`, DELETE histórico, filtro Mensagens |
| 1.0.7-rc07f | RC-07F: unwrapper Baileys, ChatIdentityResolver, archive/health, repair histórico |
| 1.0.6-rc06f | RC-06F: message fidelity, ChatContactResolver, /api/whatsapp/fidelity, diagnostics |
| 1.0.5-rc07 | RC-07: Baileys reconnect fix, name bootstrap, message previews |
| 1.0.4-rc06 | RC-06: display names (ContactNameResolver, backfill, UI sem JIDs) |
| 1.0.3-rc05 | RC-05: runtime refresh, archive/chats fix, chatId filter, UI error states |
| 1.0.2-rc04 | RC-04 Message Archive: classificador, rawPayload, métricas, UI 2 colunas |
| 1.0.1-assistant-01a | Rebranding UI: sidebar neon, Sumário, menu 4 itens, redirect |
| 1.0.0-planning | Pivot WhatsApp Assistant — docs + spec Assistant-01 |
| 0.0.13 | RC-03 WhatsApp runtime (legado Finance AI) |
| 0.0.x | Epics financeiras (deprecated) |
