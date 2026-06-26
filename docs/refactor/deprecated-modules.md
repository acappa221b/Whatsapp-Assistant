# Módulos Deprecated — Finance AI → WhatsApp Assistant

**Status:** DEPRECATED (não remover até conclusão do plano de migração)  
**Data:** 2025-06-25

> Regra: marcar → mapear dependências → plano de remoção → remover por fase. **Nunca** apagar código financeiro antes da Epic Assistant-01 estar estável.

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| 🔴 | Remover após Assistant-01 |
| 🟡 | Manter temporariamente (dependência técnica) |
| 🟢 | Reutilizar / evoluir |

---

## Domínios de negócio (packages/core)

| Módulo | Status | Localização | Dependentes |
|--------|--------|-------------|-------------|
| Expense | 🔴 DEPRECATED | `packages/core/src/domains/expense/` | Prisma `Expense`, API `/api/expenses`, UI `/dashboard/expenses`, Epic 02/06/08 harnesses |
| Revenue | 🔴 DEPRECATED | `packages/core/src/domains/revenue/` | Prisma `Revenue`, Epic 02 harnesses |
| Category | 🔴 DEPRECATED | `packages/core/src/domains/category/` | Prisma `Category`, Expense relation, Epic 02 |
| Supplier | 🔴 DEPRECATED | `packages/core/src/domains/supplier/` | Prisma `Supplier`, Expense relation, Epic 02 |
| User (financeiro) | 🟡 DEPRECATED | `packages/core/src/domains/user/` | Prisma `User` — pode evoluir para `WhatsappParticipant` |
| Extraction (financeira) | 🔴 DEPRECATED | `packages/core/src/domains/extraction/` | Prisma `Extraction`, `/api/extractions`, `/dashboard/extractions`, Epic 06/07 |
| Message Processing (financeiro) | 🔴 DEPRECATED | `packages/core/src/domains/message-processing/` | Pipeline processors, `/dashboard/pipeline`, Epic 05 |
| Approval Queue | 🔴 DEPRECATED | Spec Epic 08, Prisma `ApprovalQueue` | `/dashboard/approvals` (placeholder) |
| Financial Candidate | 🔴 DEPRECATED | Spec Epic 08 | Harness Epic 08 |
| Attachment (expense) | 🔴 DEPRECATED | `packages/core/src/domains/attachment/` | Prisma `Attachment` → Expense |
| WhatsappMessage | 🟢 ATIVO | `packages/core/src/domains/whatsapp-message/` | Base do Assistant |
| WhatsappChatConfig | 🟢 ATIVO (evoluir) | `packages/core/src/domains/whatsapp-chat-config/` | Renomear campos financeiros (`aiProcessingEnabled` → deprecated) |

---

## Pacotes

| Pacote | Status | Ação |
|--------|--------|------|
| `@finance-ai/whatsapp` | 🟢 ATIVO | Core do produto |
| `@finance-ai/database` | 🟢 ATIVO | Remover models deprecated por migration |
| `@finance-ai/shared` | 🟢 ATIVO | Renomear `APP_NAME`; remover config financeira |
| `@finance-ai/core` | 🟡 ATIVO | Podar domínios deprecated |
| `@finance-ai/ai` | 🟡 PARCIAL | Manter apenas Whisper/transcrição; deprecar OCR financeiro |
| `@finance-ai/excel` | 🔴 DEPRECATED | Remover após Fase 4 |
| `@finance-ai/audit` | 🟡 DEPRECATED | Opcional para Assistant; reavaliar |

---

## Prisma (packages/database)

| Model | Status | Substituição |
|-------|--------|--------------|
| `Expense` | 🔴 | — |
| `Revenue` | 🔴 | — |
| `Category` | 🔴 | — |
| `Supplier` | 🔴 | — |
| `Attachment` | 🔴 | — |
| `Extraction` | 🔴 | `Transcription` + `MessageIndex` (Assistant-01+) |
| `ApprovalQueue` | 🔴 | — |
| `User` | 🟡 | `WhatsappParticipant` |
| `WhatsappMessage` | 🟢 | Estender: `transcription`, `senderName`, `userId` |
| `WhatsappChatConfig` | 🟢 | Simplificar flags |
| `AuditLog` | 🟡 | Manter para operações de sistema |
| `DailyReport` | 🟢 NOVO | Spec Fase 2 — retenção permanente |

---

## UI (apps/dashboard)

| Rota | Status | Ação |
|------|--------|------|
| `/dashboard` (Overview) | 🔴 | Substituir por **Sumário** |
| `/dashboard/messages` | 🟢 | Redesenhar inbox + histórico |
| `/dashboard/chats` | 🟡 | Mesclar em `/dashboard/messages` |
| `/dashboard/whatsapp` | 🟢 | Manter e expandir |
| `/dashboard/reports` | 🟢 SPEC ONLY | Implementação Fase 2 |
| `/dashboard/pipeline` | 🔴 | Remover — **Pipeline Financeiro** |
| `/dashboard/extractions` | 🔴 | Remover |
| `/dashboard/expenses` | 🔴 | Remover |
| `/dashboard/approvals` | 🔴 | Remover |
| `/dashboard/settings` | 🔴 | Remover config financeira |
| `/` | 🟢 | Redirect automático → `/dashboard` |

### Menu final (alvo)

```
Dashboard | Mensagens | WhatsApp | Relatórios
```

---

## API Routes

| Rota | Status |
|------|--------|
| `/api/whatsapp/*` | 🟢 ATIVO |
| `/api/health/*` | 🟢 ATIVO |
| `/api/extractions` | 🔴 DEPRECATED |
| `/api/pipeline/*` | 🔴 DEPRECATED |
| `/api/expenses` (se existir) | 🔴 DEPRECATED |

---

## Specs Epics (legado)

| Epic | Status |
|------|--------|
| epic-01 | 🟡 Infra base — reutilizar CI/harness pattern |
| epic-02 | 🔴 DEPRECATED — domínio financeiro |
| epic-03 | 🟡 DEPRECATED parcial — Prisma patterns reutilizáveis |
| epic-04 | 🟢 Base WhatsApp — absorvida por Assistant-01 |
| epic-05 | 🔴 DEPRECATED — pipeline financeiro |
| epic-06 | 🔴 DEPRECATED — extração financeira IA |
| epic-07 | 🔴 DEPRECATED — OCR/mídia financeira |
| epic-08 | 🔴 DEPRECATED — approval/financial candidate |
| **epic-assistant-01** | 🟢 **NOVA — fonte de verdade** |

---

## Harnesses deprecated (remover por fase)

- `harness/epic-02/*` (domínio financeiro)
- `harness/epic-05/*` (pipeline financeiro)
- `harness/epic-06/*` (extração IA financeira)
- `harness/epic-07/*` (OCR financeiro)
- `harness/epic-08/*` (approval queue)
- Manter: `epic-04`, `rc-03`, `epic-assistant-01`

---

## Ordem de remoção recomendada

1. **Fase A** — UI: ocultar rotas deprecated do menu (sem apagar código)
2. **Fase B** — Desligar pipeline financeiro (`message-processing`, `/api/extractions`)
3. **Fase C** — Remover páginas e APIs financeiras
4. **Fase D** — Migration Prisma: drop tables deprecated
5. **Fase E** — Remover packages `excel`, domínios core deprecated
6. **Fase F** — Renomear monorepo `@finance-ai/*` → `@whatsapp-assistant/*` (opcional, ADR separado)

Ver [migration-plan.md](./migration-plan.md).
