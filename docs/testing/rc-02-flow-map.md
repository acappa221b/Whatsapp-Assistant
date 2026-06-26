# RC-02 — Mapa completo do fluxo WhatsApp → Persistência → API → Dashboard

Data: 2026-06-25  
Versão app: `0.0.12`  
Escopo: investigação de regressão (sem correções)

---

## 1. Visão geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BAILEYS (packages/whatsapp)                                                 │
│  baileys-socket.factory.ts                                                  │
│    socket.ev.on('messages.upsert') ─────────────────────────────┐           │
│    socket.ev.on('connection.update')                             │           │
│    attachGroupDiscoveryListeners (groups/chats — só log)         │           │
└──────────────────────────────────────────────────────────────────┼──────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BaileysWhatsappProvider.handleMessages()                                    │
│  packages/whatsapp/src/providers/baileys.provider.ts                        │
│    logIncomingMessageDiscovery()                                            │
│    whatsappMediaRegistry.register(raw)                                      │
│    mapBaileysMessage(raw) → null se fromMe ou id/jid ausente                │
│    onMessage handlers (Set)                                                 │
└──────────────────────────────────────────────────────────────────┼──────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ RUNTIME (apps/dashboard/src/lib/whatsapp/runtime.ts)                          │
│  ensureWhatsappPipelinesRegistered() — OBRIGATÓRIO para ingresso              │
│    WhatsappMessagePipeline.register()                                       │
│    WhatsappConnectionPipeline.register()                                    │
│    provider.onMessage → eventBus.publish(WhatsappMessageReceived)           │
│    ensureProcessingPipelineRegistered()                                     │
└──────────────────────────────────────────────────────────────────┼──────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVENT BUS (InMemoryEventBus — globalThis singleton)                           │
│  WhatsappMessageReceived                                                    │
└──────────────────────────────────────────────────────────────────┼──────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ WhatsappMessagePipeline                                                     │
│  packages/whatsapp/src/pipeline/whatsapp-message.pipeline.ts                │
│    EnsureWhatsappChatDiscoveredUseCase → WhatsappChatConfig (SQLite)        │
│    StoreWhatsappMessageUseCase → WhatsappMessage (SQLite)                     │
│    publish(WhatsappMessagePersisted)                                        │
└──────────────────────────────────────────────────────────────────┼──────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ MessageProcessingPipeline (governança RC-08)                                │
│  packages/core/.../message-processing.pipeline.ts                             │
│    aiProcessingEnabled=false → SkipMessageProcessing (mensagem persiste)    │
│    aiProcessingEnabled=true  → Enqueue + OpenAI                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Onde o Baileys recebe eventos

| Evento | Arquivo | Listener | Efeito colateral |
|--------|---------|----------|------------------|
| `messages.upsert` | `baileys-socket.factory.ts:80` | `options.onMessages(messages)` | **Único evento que alimenta persistência** |
| `connection.update` | `baileys-socket.factory.ts:64` | `onConnectionUpdate` + QR | Status provider |
| `creds.update` | `baileys-socket.factory.ts:76` | `saveCreds()` | Sessão em disco |
| `groups.update` | `group-discovery.ts:31` | log filtrado por nome | **Não persiste** |
| `groups.upsert` | `group-discovery.ts:38` | log filtrado | **Não persiste** |
| `chats.upsert` | `group-discovery.ts:45` | log filtrado | **Não persiste** |
| `messages.update` | *(RC-02 instrumentado)* | log diagnóstico | **Não persiste** |
| `chats.update` | *(RC-02 instrumentado)* | log diagnóstico | **Não persiste** |

Configuração relevante: `syncFullHistory: false` — histórico antigo **não** é sincronizado; apenas mensagens novas após conexão.

---

## 3. Transformação em WhatsappMessage

| Etapa | Arquivo | Função |
|-------|---------|--------|
| Raw Baileys | `baileys-message.util.ts` | `mapBaileysMessage()` |
| Filtros de descarte | `baileys-message.util.ts:43-46` | `fromMe`, `id` ou `remoteJid` ausentes |
| IncomingMessage | `baileys.provider.ts:270-276` | adiciona `mediaUrl` baileys:// para IMAGE/DOCUMENT |
| StoreWhatsappMessageInput | `whatsapp-message.use-cases.ts` | mesmo shape do IncomingMessage |
| Entidade + DB | `WhatsappMessagePrismaRepository.save()` | tabela `WhatsappMessage` |

---

## 4. Persistência

| Recurso | Tabela Prisma | Gatilho de escrita |
|---------|---------------|-------------------|
| Mensagens | `WhatsappMessage` | `StoreWhatsappMessageUseCase` via pipeline |
| Chats/grupos (governança) | `WhatsappChatConfig` | `EnsureWhatsappChatDiscoveredUseCase` no pipeline **ou** backfill em `GET /api/whatsapp/chats` |
| Nomes de grupo | — | **Não persistidos** a partir de eventos Baileys (`groups.update` só loga) |

Duplicatas: `externalMessageId` único → `ConflictError` → evento `WhatsappMessageFailed` (mensagem não re-inserida).

---

## 5. Publicação no Event Bus

| Evento | Publicado em | Consumido por |
|--------|--------------|---------------|
| `WhatsappMessageReceived` | `runtime.ts` (`onMessage`) | `WhatsappMessagePipeline` |
| `WhatsappMessagePersisted` | `StoreWhatsappMessageUseCase` | `MessageProcessingPipeline` |
| `WhatsappMessageFailed` | `WhatsappMessagePipeline` (catch) | *(sem handler dedicado no dashboard)* |
| `WhatsappConnected` | `WhatsappConnectionPipeline` | *(sem handler dedicado)* |
| `WhatsappDisconnected` | `WhatsappConnectionPipeline` | *(sem handler dedicado)* |

**Importante:** `InMemoryEventBus` é volátil — reinício do processo Next.js zera handlers até `ensureWhatsappPipelinesRegistered()` ser chamado novamente.

---

## 6. Criação/atualização de chats

| Caminho | Persiste? | Detalhe |
|---------|-----------|---------|
| Mensagem recebida → pipeline | ✅ | `EnsureWhatsappChatDiscoveredUseCase` cria row com `aiProcessingEnabled=false` |
| `GET /api/whatsapp/chats` | ✅ (backfill) | Varre `distinct chatId` em `WhatsappMessage` e chama `ensureChatDiscovered` |
| Baileys `chats.upsert` / `groups.update` | ❌ | Apenas logs em `group-discovery.ts` |
| UI PATCH `/api/whatsapp/chats/:chatId` | ✅ | Atualiza flags de governança |

**Consequência:** a lista de Chats **só cresce quando há mensagens persistidas** (ou backfill na API). Eventos de grupo do Baileys sem mensagem associada **não** aparecem no dashboard.

---

## 7. Onde a UI busca dados

| Tela | Rota UI | Endpoint | Polling |
|------|---------|----------|---------|
| Mensagens | `/dashboard/messages` | `GET /api/whatsapp/messages?limit=50` | 5 s |
| Governança de chats | `/dashboard/chats` | `GET /api/whatsapp/chats` | 5 s |
| Conexão WhatsApp | `/dashboard/whatsapp` | `GET /api/whatsapp/status` + SSE `/api/whatsapp/events` | 2–10 s |
| Grupos (dedicado) | — | **Não existe** `GET /api/whatsapp/groups` | — |

---

## 8. APIs que alimentam cada tela

### `/dashboard/messages`

- **API:** `GET /api/whatsapp/messages`
- **Use case:** `ListWhatsappMessagesUseCase`
- **Ordenação:** `receivedAt DESC`
- **Não chama** `ensureWhatsappPipelinesRegistered()` — apenas lê banco

### Seleção de chats / grupos

- **API:** `GET /api/whatsapp/chats`
- **Use case:** `ListWhatsappChatConfigsUseCase` + backfill de `chatId` distintos
- **Chama** `ensureWhatsappPipelinesRegistered()`
- Grupos `@g.us` e chats `@lid` aparecem na **mesma lista** (sem endpoint separado)

---

## 9. Registro de pipelines por rota API

| Rota | `ensureWhatsappPipelinesRegistered()` |
|------|---------------------------------------|
| `GET /api/whatsapp/status` | ✅ |
| `GET /api/whatsapp/events` (SSE) | ✅ |
| `POST /api/whatsapp/connect` | ✅ |
| `POST /api/whatsapp/disconnect` | ✅ |
| `GET /api/whatsapp/chats` | ✅ |
| `PATCH /api/whatsapp/chats/:chatId` | ✅ |
| `GET /api/whatsapp/messages` | ❌ **ausente** |
| `PATCH /api/whatsapp/messages/:id/processed` | ✅ |

**Gap identificado:** abrir somente `/dashboard/messages` não registra pipelines. Ingresso de mensagens depende de visita prévia a `/dashboard/whatsapp` (status/SSE) ou `/dashboard/chats`, ou `POST /connect`.

---

## 10. Auto-conexão e ciclo de vida da sessão

| Comportamento | Detalhe |
|---------------|---------|
| Startup Next.js | Provider inicia `disconnected`; **sem auto-connect** |
| `POST /connect` | Chama `connectFresh()` → apaga sessão em disco → exige novo QR |
| Reconnect in-process | `autoReconnect` só após disconnect **dentro do mesmo processo** |
| Reinício `pnpm dev` | Estado Baileys perdido; reconexão manual obrigatória |

---

## 11. Arquivos-chave (referência rápida)

| Área | Caminho |
|------|---------|
| Socket Baileys | `packages/whatsapp/src/providers/baileys-socket.factory.ts` |
| Provider | `packages/whatsapp/src/providers/baileys.provider.ts` |
| Mapeamento | `packages/whatsapp/src/utils/baileys-message.util.ts` |
| Discovery (log) | `packages/whatsapp/src/utils/group-discovery.ts` |
| Pipeline mensagem | `packages/whatsapp/src/pipeline/whatsapp-message.pipeline.ts` |
| Runtime dashboard | `apps/dashboard/src/lib/whatsapp/runtime.ts` |
| Pipeline IA | `apps/dashboard/src/lib/pipeline/runtime.ts` |
| API mensagens | `apps/dashboard/src/app/api/whatsapp/messages/route.ts` |
| API chats | `apps/dashboard/src/app/api/whatsapp/chats/route.ts` |
| UI mensagens | `apps/dashboard/src/app/dashboard/messages/page.tsx` |
| UI chats | `apps/dashboard/src/app/dashboard/chats/page.tsx` |
| Banco | `packages/database/prisma/dev.db` |
| Logs RC-02 | `packages/whatsapp/src/utils/rc-02-diagnostic.ts` |
| Harness DB | `harness/rc-02/db-snapshot.ts` |
| Harness API | `harness/rc-02/api-snapshot.ts` |
