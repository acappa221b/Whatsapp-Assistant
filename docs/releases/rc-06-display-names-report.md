# RC-06 Display Names — Release Report

**Versão:** 1.0.4-rc06  
**Data:** 2025-06-25

---

## Problema

Message Archive UI exibia IDs opacos (`158304038858972`, `@lid`, JIDs) porque:
- `mapBaileysMessage` não preenchia `chatName`
- `senderName` dependia só de `pushName`
- Sem listeners `contacts.*` nem `groupMetadata` sob demanda
- Pipeline não passava nomes para `ensureChatDiscoveredUseCase`
- Mensagens históricas não eram enriquecidas após descoberta

---

## Correções

### Baileys
- `ContactNameResolver` — cache em memória com prioridade contact > pushName > chat/group
- `attachContactDiscoveryListeners` — `contacts.upsert` / `contacts.update`
- `groupMetadata` async (5s timeout) para grupos `@g.us`
- `mapBaileysMessage` aceita resolver opcional

### Core / Persistência
- `BackfillWhatsappMessageNamesUseCase` + `repository.backfillMissingNames`
- `EnsureWhatsappChatDiscoveredUseCase` — upgrade quando nome melhor
- `StoreWhatsappMessageUseCase` — enrich tardio com `isMoreInformativeName`
- Pipeline passa `payload.chatName` para discover

### API / UI
- `resolveChatDisplayName` / `resolveSenderDisplayName` nas rotas
- `MessageArchiveView` — zero JID visível; fallbacks Conversa/Contato
- `/dashboard/chats` — coluna legível em vez de chatId mono

### Runtime
- `WHATSAPP_RUNTIME_VERSION = 3` — invalida singleton stale
- Wiring resolver + backfill no bootstrap

---

## Validação

```bash
pnpm test:unit
pnpm typecheck
pnpm harness
pnpm rc:06:backfill-names   # opcional — dados históricos
```

**Reiniciar `pnpm dev`** após deploy para aplicar `[RUNTIME_REBUILD]` v3.

---

## Arquivos principais

| Área | Path |
|------|------|
| Resolver | `packages/whatsapp/src/utils/contact-name-resolver.ts` |
| Discovery | `packages/whatsapp/src/utils/contact-discovery.ts` |
| Display helpers | `packages/shared/src/utils/display-name.ts` |
| Backfill UC | `packages/core/.../backfill-whatsapp-message-names.use-case.ts` |
| Harness | `harness/rc-06/index.ts` |
| Backfill script | `packages/database/scripts/rc-06-backfill-names.ts` |
| Spec | `specs/rc-06-display-names/` |

---

## Próximo passo

Assistant-01C — Whisper (fora do escopo RC-06).
