# Arquitetura — WhatsApp Assistant

**Status:** Alvo — UI Assistant-01A implementada (sidebar, Sumário mock)  
**Substitui parcialmente:** [overview.md](./overview.md) (legado Finance AI)

---

## Visão geral

```
WhatsApp (Baileys)
       │
       ▼
┌──────────────────┐
│  Ingest Layer    │  messages.upsert, chats.upsert, groups.*
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Normalizer      │  unwrap envelopes, map types, extract text
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Event Bus       │  WhatsappMessageReceived, AudioReceived, …
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌─────────────┐
│ Store  │ │ Transcribe  │  Whisper (OpenAI)
│ Message│ │ Pipeline    │
└───┬────┘ └──────┬──────┘
    │             │
    ▼             ▼
┌─────────────────────────┐
│  SQLite / PostgreSQL    │
│  WhatsappMessage        │
│  WhatsappParticipant    │
│  WhatsappChat           │
│  Transcription          │
│  DailyReport (Fase 2)   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Next.js Dashboard      │
│  Sumário | Mensagens |  │
│  WhatsApp | Relatórios  │
└─────────────────────────┘
```

---

## Camadas

### 1. Ingest (`packages/whatsapp`)

- `BaileysWhatsappProvider` — conexão, QR, reconexão
- `messages.upsert` → normalizer → event bus
- Download de mídia (áudio, imagem, documento)
- **Sem** processamento financeiro

### 2. Core (`packages/core`)

Domínios **ativos**:

| Domínio | Responsabilidade |
|---------|------------------|
| `whatsapp-message` | Persistir mensagem, listar, marcar processada |
| `whatsapp-chat` | Chat/grupo, nome, última atividade |
| `whatsapp-participant` | Usuário WhatsApp (jid, nome, telefone) |
| `transcription` | Job Whisper, texto associado à mensagem |
| `conversation-index` | Texto indexável (content + transcription) |
| `retention` | Purge > 60 dias (mensagens only) |
| `daily-report` | Fase 2 — relatórios permanentes |

Domínios **deprecated**: ver [deprecated-modules.md](../refactor/deprecated-modules.md)

### 3. Database (`packages/database`)

- Prisma ORM
- Migrations incrementais (nunca drop em hotfix)
- Índices: `chatId`, `receivedAt`, `sender`, `messageType`

### 4. AI (`packages/ai`) — escopo reduzido

| Capacidade | Status |
|------------|--------|
| Whisper transcrição | 🟢 Assistant-01 |
| OCR / Vision financeiro | 🔴 DEPRECATED |
| Structured Outputs expense | 🔴 DEPRECATED |

### 5. Dashboard (`apps/dashboard`)

- Route Handlers (API)
- UI React 19 + Tailwind + Recharts
- SSE para QR/status WhatsApp

---

## Fluxo: mensagem de texto

```
messages.upsert
  → unwrapMessageContent()
  → mapBaileysMessage()
  → EventBus: WhatsappMessageReceived
  → StoreWhatsappMessageUseCase
  → Upsert WhatsappParticipant (sender)
  → Upsert WhatsappChat (chatId)
  → Prisma WhatsappMessage
```

## Fluxo: mensagem de áudio

```
messages.upsert (AUDIO)
  → StoreWhatsappMessage (metadata)
  → EventBus: WhatsappAudioReceived
  → DownloadMediaUseCase
  → TranscribeAudioUseCase (Whisper)
  → Update message.content OR Transcription table
  → UI exibe texto transcrito
```

---

## Memória conversacional

| Tipo | Retenção |
|------|----------|
| Mensagens + transcrições | **60 dias** rolling |
| Metadados de chat/participante | Enquanto houver mensagem no window |
| Relatórios diários | **Permanente** |
| Mídia (áudio/imagem) | 60 dias (alinhado à mensagem) |

Job: `RetentionPurgeJob` — cron diário, apaga `receivedAt < now - 60d`.

---

## Segurança

- Sessão Baileys em `storage/whatsapp` (gitignored)
- Mídia em `storage/media` (gitignored)
- API keys via `.env`
- Sem exposição de JIDs em logs públicos

---

## Stack (mantida)

| Camada | Tech |
|--------|------|
| Frontend | Next.js 15, React 19, Tailwind, Recharts |
| Backend | Next.js Route Handlers |
| DB | Prisma, SQLite → PostgreSQL |
| WhatsApp | Baileys |
| Transcrição | OpenAI Whisper API |
| Testes | Vitest, Playwright, Harnesses |

---

## ADRs relevantes

- [ADR-001](./adr/001-general-architecture.md) — legado; superseded parcialmente por ADR-009
- [ADR-005](./adr/005-whatsapp-qr-sse.md) — QR via SSE (mantido)
- [ADR-009](./adr/009-product-pivot-whatsapp-assistant.md) — pivot de produto

---

## Estrutura de pastas (alvo)

```
apps/dashboard/
packages/
  whatsapp/          # Baileys ingest
  core/              # Domínios assistant
  database/          # Prisma
  shared/            # Config, errors
  ai/                # Whisper only (Fase 1)
specs/
  epic-assistant-01/ # Spec ativa
  epic-XX/           # Legado DEPRECATED
docs/
  product/
  refactor/
  whisper/
  architecture/
harness/
  epic-assistant-01/
```
