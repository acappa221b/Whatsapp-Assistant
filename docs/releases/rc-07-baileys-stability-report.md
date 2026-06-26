# RC-07 — Baileys Stability Report

**Versão:** 1.0.5-rc07  
**Data:** 2025-06-25

---

## Causas raiz

| Problema | Causa |
|----------|-------|
| Reconnect loop | Socket leak: `connect()` não fazia teardown quando `status=disconnected` + `socket!=null` |
| Nomes genéricos | DB sem nomes; groupMetadata silencioso; sem bootstrap on open |
| Conteúdo vazio | `content` vazio no DB; preview sidebar sem fallback |

Investigação: [docs/investigations/rc-07-baileys-stability-and-names.md](../investigations/rc-07-baileys-stability-and-names.md)

---

## Correções

### A — Estabilidade Baileys
- Teardown sempre que `socket != null` antes de novo connect
- `removeAllListeners` em todos eventos RC-06
- Blacklist reconnect: 401, 403, 405, 409, 411, 440, 500
- Mutex `connectingInFlight` + backoff exponencial
- Logs `[RC-07/connection.update]` com socketInstanceId
- Conflict 440 → `operationalMessage` no banner

### B — Nomes reais
- `bootstrapWhatsappNames` on `connection: open`
- `backfillNamesFromRawPayload` (pushName em rawPayload)
- `chatNameLookup` cache de WhatsappChatConfig
- `@lid` match por sufixo numérico
- Log warn em falha groupMetadata

### C — Conteúdo / previews
- `resolveMessagePreview` / `resolveMessageDisplayContent`
- API archive/chats + messages aplicam fallbacks
- `backfillContentFromRawPayload` no bootstrap

---

## Validação

```bash
pnpm test:unit
pnpm typecheck
pnpm harness
pnpm rc:07:names-diagnostic
```

**Reiniciar `pnpm dev`** — `WHATSAPP_RUNTIME_VERSION=4`

---

## Scripts

- `pnpm rc:07:names-diagnostic` — contagens DB nomes/conteúdo
- `pnpm rc:06:backfill-names` — backfill histórico configs

---

## Próximo passo

Assistant-01C — Whisper (fora do escopo RC-07)
