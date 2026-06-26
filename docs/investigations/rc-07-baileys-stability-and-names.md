# RC-07 — Baileys Stability + Real Names + Message Content

## Root cause summary

| Problema | Causa raiz | Fix RC-07 |
|----------|------------|-----------|
| **A — Reconnect loop** | Após `connection: close`, `status=disconnected` mas `this.socket` permanece; `connect()` só faz teardown em `connecting`/`qr` → novo socket sobrescreve o anterior sem `end()` → múltiplas sessões → Boom 440 (conflict) → reconnect infinito | A1–A6 em `baileys.provider.ts` |
| **B — Nomes genéricos** | DB sem `chatName`/`senderName`; `groupMetadata` falha silenciosa; `syncFullHistory: false` limita sync inicial; API aplica fallback `"Grupo"`/`"Contato"` quando DB null | Bootstrap on open + backfill rawPayload + logs |
| **C — Conteúdo vazio** | `content` vazio no DB (TEXT pré-RC-04, UNKNOWN); sidebar usa `latest.content ?? ''` → UI mostra `[TEXT]`; instabilidade bloqueia ingestão nova | Preview fallback + reprocess rawPayload |

---

## Problema A — Evidência no código

```typescript
// baileys.provider.ts (pré-RC-07)
async connect() {
  if (this.status.status === 'connected') return
  if (this.status.status === 'connecting' || this.status.status === 'qr') {
    await this.teardownConnection()  // ← só estes status
  }
  await this.startConnection()       // ← disconnected + socket != null → leak
}
```

`teardownConnection()` removia apenas `connection.update` e `messages.upsert` — listeners RC-06 (`contacts.*`, `groups.*`, `chats.*`) ficavam órfãos.

Status codes excluídos do reconnect: apenas 401, 405. **440 (conflict)** não estava na blacklist.

---

## Problema B — Evidência

- `resolveChatDisplayName()` retorna `"Grupo"`/`"Conversa"` quando `chatName` IS NULL no DB
- `ContactNameResolver.fetchGroupMetadata()` engolia erros (`catch {}`)
- `rc:06:backfill-names` só ajuda se `WhatsappChatConfig.name` já existe
- Mensagens históricas têm `pushName` em `rawPayload` mas `senderName` null

---

## Problema C — Evidência

- `listChatSummaries`: `lastMessagePreview: latest?.content ?? ''`
- UI: `chat.lastMessagePreview || \`[${chat.lastMessageType}]\``
- Mensagens TEXT com `content=''` ou UNKNOWN com `[unclassified:...]` no classificador

---

## Reprodução

1. `pnpm dev` com sessão válida
2. Abrir WhatsApp Web no celular em paralelo → logs `[RC-07/connection.update]` com statusCode 440
3. `/dashboard/messages` → todos chats "Grupo"/"Conversa", preview `[TEXT]`
4. Query: `SELECT COUNT(*) FROM WhatsappMessage WHERE chatName IS NULL`

---

## Fixes aplicados (RC-07)

Ver `docs/releases/rc-07-baileys-stability-report.md`.
