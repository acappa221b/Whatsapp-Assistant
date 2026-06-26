# RC-06 — Display Names (Baileys → UI)

**Versão:** 1.0.4-rc06  
**Status:** Implementação

---

## Objetivo

Exibir **apenas nomes legíveis** de chats, grupos e remetentes em `/dashboard/messages`. IDs/JIDs permanecem no banco e APIs internas, mas não são renderizados na UI.

---

## Problema

- `mapBaileysMessage` define `chatName: null` sempre
- `senderName` depende só de `pushName` (frequentemente ausente)
- UI faz fallback para `chatId.replace(/@.+$/, '')` — expõe LIDs numéricos
- Pipeline não passa nome para `ensureChatDiscoveredUseCase`
- Sem listeners `contacts.*` nem `groupMetadata` sob demanda
- Mensagens antigas sem nome não são enriquecidas após descoberta

---

## Escopo IN

1. `ContactNameResolver` — cache em memória + prioridade de resolução
2. Listeners `contacts.upsert` / `contacts.update` + resolução async de grupos
3. Enriquecimento na ingestão (`chatName`, `senderName`)
4. Pipeline passa nome; backfill em mensagens existentes
5. API retorna nomes legíveis (fallback amigável)
6. UI remove JIDs/IDs visíveis
7. Testes + harness `rc-06`

---

## Escopo OUT

- Nova entidade `WhatsappParticipant` / `WhatsappChat`
- Whisper / OpenAI / RAG / financeiro
- `syncFullHistory: true`
- Remover `chatId`/`senderId` do schema
- Envio de mensagens

---

## Fluxo alvo

```
Baileys (messages.upsert, contacts.*, chats.*, groups.*)
  → ContactNameResolver (cache + groupMetadata on demand)
  → mapBaileysMessage (chatName + senderName)
  → WhatsappMessagePipeline
      → ensureChatDiscovered(chatId, name)
      → StoreWhatsappMessageUseCase (upsert + enrich)
      → BackfillWhatsappMessageNamesUseCase
  → GET /api/whatsapp/archive/chats | /messages
  → MessageArchiveView (somente nomes legíveis)
```

---

## Decisões

- **syncFullHistory:** permanece `false` — nomes vêm de eventos live + cache + backfill manual opcional
- **Schema:** reutiliza `WhatsappChatConfig.name` + campos em `WhatsappMessage`; sem migração
- **Fallback UI:** `"Grupo"` / `"Conversa"` / `"Contato"` — nunca JID
