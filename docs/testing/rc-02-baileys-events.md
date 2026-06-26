# RC-02 — Validação de eventos Baileys

Data: 2026-06-25  
Versão app: `0.0.12`  
Instrumentação: `packages/whatsapp/src/utils/rc-02-diagnostic.ts` + listeners em `baileys-socket.factory.ts`

---

## Metodologia

1. Logs `[RC-02/BAILEYS_EVENT]` e `[RC-02/WHATSAPP_EVENT_RECEIVED]` adicionados nos listeners.
2. Snapshot do banco via `pnpm exec tsx harness/rc-02/db-snapshot.ts`.
3. Chamadas API com servidor em `localhost:4000`.
4. Evidência indireta de `messages.upsert` funcional a partir de mensagens persistidas hoje (`2026-06-25T12:17`).

**Limitação:** durante esta RC o servidor foi reiniciado para instrumentação; Baileys ficou `disconnected` sem aparelho pareado no momento da captura. Eventos ao vivo exigem reconexão manual em `/dashboard/whatsapp`.

---

## 1. Os eventos estão chegando?

| Contexto | Resposta |
|----------|----------|
| Servidor recém-iniciado, sem `POST /connect` | **Não** — socket Baileys não está ativo (`status: disconnected`, `liveMessageCount: 0`) |
| Sessão conectada anteriormente (mesmo processo) | **Sim** — evidência: 2 mensagens persistidas às `12:17:47` e `12:17:52` em `158304038858972@lid` |
| Após reinício do dev server | **Não**, até reconectar |

---

## 2. Quais eventos chegam?

### Comprovados (por persistência + logs legados)

| Evento | Evidência | Última ocorrência observável |
|--------|-----------|------------------------------|
| `messages.upsert` | 30 mensagens no banco; 2 novas hoje | `2026-06-25T12:17:52Z` |
| `connection.update` | RC-01/RC-03 docs; status API | Última sessão manual do operador |

### Instrumentados (aguardam sessão ativa para captura ao vivo)

| Evento | Listener | Log tag |
|--------|----------|---------|
| `messages.upsert` | `baileys-socket.factory.ts` | `WHATSAPP_EVENT_RECEIVED` |
| `messages.update` | `baileys-socket.factory.ts` | `BAILEYS_EVENT` |
| `chats.upsert` | `baileys-socket.factory.ts` | `BAILEYS_EVENT` |
| `chats.update` | `baileys-socket.factory.ts` | `BAILEYS_EVENT` |
| `groups.update` | `baileys-socket.factory.ts` + `group-discovery.ts` | `BAILEYS_EVENT` |
| `connection.update` | `baileys-socket.factory.ts` | `BAILEYS_EVENT` |

### Formato de log esperado (exemplo)

```json
[RC-02/WHATSAPP_EVENT_RECEIVED] {
  "at": "2026-06-25T12:30:00.000Z",
  "event": "messages.upsert",
  "count": 1,
  "items": [{
    "chatId": "120363421372276062@g.us",
    "chatType": "group",
    "messageId": "AC16D319...",
    "fromMe": false
  }]
}
```

---

## 3. Quais eventos não chegam (ou não produzem efeito)?

| Evento / situação | Comportamento |
|-------------------|---------------|
| `messages.upsert` com `fromMe: true` | Chega ao socket, **descartado** em `mapBaileysMessage` → `MESSAGE_UPSERT_FAILED reason=fromMe` |
| `chats.upsert` / `groups.update` | Podem chegar ao socket, **não atualizam** `WhatsappChatConfig` nem UI |
| `messages.update` | Instrumentado; **não altera** persistência |
| Qualquer evento com servidor `disconnected` | **Não chegam** — socket inexistente |
| Histórico pré-conexão | **Não chega** — `syncFullHistory: false` |

---

## 4. Sequência observada no banco (proxy de messages.upsert)

Últimas 5 mensagens (`harness/rc-02/db-snapshot.ts` em `2026-06-25T12:22:17Z`):

| receivedAt | chatId | chatType | content |
|------------|--------|----------|---------|
| 2026-06-25T12:17:52Z | `158304038858972@lid` | lid | *(vazio — provável mídia)* |
| 2026-06-25T12:17:47Z | `158304038858972@lid` | lid | *(vazio)* |
| 2026-06-25T10:41:11Z | `120363421372276062@g.us` | group | *(vazio)* |
| 2026-06-25T10:41:05Z | `120363421372276062@g.us` | group | *(vazio)* |
| 2026-06-24T18:51:07Z | `120363421372276062@g.us` | group | `16 reais água` |

**Observação:** mensagens recentes do grupo alvo usam tanto `@g.us` quanto `@lid`. O dashboard exibe `chatId` bruto — o operador pode buscar `@g.us` enquanto mensagens novas chegam em `@lid`.

---

## 5. Contadores no momento da captura

| Métrica | Valor |
|---------|-------|
| Mensagens no banco | 30 |
| Chats em `WhatsappChatConfig` | 7 |
| Grupos (`@g.us`) | 3 |
| `liveMessageCount` (provider, servidor frio) | 0 |
| `messageCount` (banco, via status API) | 30 |

---

## 6. Como reproduzir captura ao vivo

1. `pnpm dev` (porta 4000)
2. Abrir `/dashboard/whatsapp` → **Conectar** → escanear QR
3. Confirmar `GET /api/whatsapp/status` → `status: "connected"`
4. Enviar mensagem de outro aparelho para o grupo monitorado
5. Observar terminal do dev server:
   - `[RC-02/WHATSAPP_EVENT_RECEIVED]`
   - `[RC-02/MESSAGE_UPSERT_START]`
   - `[RC-02/EVENT_BUS_PUBLISH]`
   - `[RC-02/CHAT_UPSERT_SUCCESS]`
   - `[RC-02/MESSAGE_UPSERT_SUCCESS]`
6. Reexecutar `pnpm exec tsx harness/rc-02/db-snapshot.ts` e comparar contadores

---

## 7. Respostas diretas

1. **Os eventos estão chegando?** — Sim, quando Baileys está conectado no mesmo processo; não após reinício sem reconexão.
2. **Quais eventos chegam?** — `messages.upsert` confirmado por persistência; demais instrumentados aguardam sessão ativa.
3. **Quais não chegam?** — Nenhum evento com processo desconectado; eventos de chat/grupo não alimentam UI sem mensagem associada.
