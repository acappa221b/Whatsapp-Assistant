# RC-03 — WhatsApp Runtime Stabilization

Data: 2026-06-25  
Versão app: `0.0.13`  
Pré-requisito: [RC-02 flow map](./rc-02-flow-map.md)

## Resumo executivo

A RC-03 transforma a integração WhatsApp em serviço persistente no processo Next.js:

1. **Auto-connect no startup** via `instrumentation.ts` + `bootstrapWhatsappRuntime()` quando sessão válida existe em disco.
2. **Endpoints separados** — `connect` / `reconnect` usam `provider.connect()`; `reset-session` é o único que chama `connectFresh()`.
3. **Pipelines no bootstrap** — registrados em `bootstrapWhatsappRuntime()`, não dependem de abertura de páginas.
4. **Status operacional expandido** — `GET /api/whatsapp/status` retorna métricas de saúde completas.
5. **Banner de diagnóstico** em `/dashboard/messages` e `/dashboard/chats`.
6. **Chat discovery** — eventos `chats.upsert`, `chats.update`, `groups.update`, `groups.upsert` persistem em `WhatsappChatConfig`.

---

## Correções implementadas

### 1. Auto-connect no startup

| Componente | Comportamento |
|---|---|
| `apps/dashboard/src/instrumentation.ts` | Chama `ensureServerReady()` ao iniciar o servidor Node |
| `server-ready.ts` | Após validação DB, chama `bootstrapWhatsappRuntime()` |
| `runtime.ts` | Se `isValidAuthSession(sessionPath)` → `provider.connect()` sem apagar sessão |

Função `isValidAuthSession()` em `baileys-connection-diagnostic.ts` valida `creds.json` com `me.id` ou `registered: true`.

### 2. Endpoints distintos

| Método | Rota | Ação |
|---|---|---|
| `POST` | `/api/whatsapp/connect` | Primeira conexão — `provider.connect()` |
| `POST` | `/api/whatsapp/reconnect` | Restaura sessão — `provider.connect()` |
| `POST` | `/api/whatsapp/reset-session` | Apaga credenciais — `provider.connectFresh()` |

UI `/dashboard/whatsapp`: botão **Nova sessão (QR)** chama `reset-session`.

### 3. Bootstrap de pipelines

`bootstrapWhatsappRuntime()` sempre executa `ensureWhatsappPipelinesRegistered()` + `ensureProcessingPipelineRegistered()`.

Todas as rotas API usam `ensureServerReady()` (idempotente).

### 4. Status operacional

`GET /api/whatsapp/status` retorna:

```json
{
  "status": "connected",
  "connected": true,
  "authenticated": true,
  "sessionLoaded": true,
  "liveMessageCount": 5,
  "messageCount": 30,
  "chatCount": 7,
  "groupCount": 3,
  "lastMessageAt": "2026-06-25T12:17:52.000Z",
  "lastEventAt": "2026-06-25T12:18:00.000Z",
  "lastEventName": "messages.upsert"
}
```

### 5. Banner de diagnóstico

Componente `WhatsappDiagnosticBanner` exibe estado `CONNECTED` / `CONNECTING` / `DISCONNECTED`, sessão, autenticação e últimos eventos.

### 6. Chat discovery

`attachGroupDiscoveryListeners(socket, { onChatDiscovered })` persiste chats/grupos via `EnsureWhatsappChatDiscoveredUseCase` sem depender de mensagens.

---

## Critério de aceite

| Passo | Resultado esperado |
|---|---|
| 1. Conectar WhatsApp (QR uma vez) | `status: connected`, `authenticated: true` |
| 2. Reiniciar `pnpm dev` | `instrumentation.ts` dispara bootstrap |
| 3. Sem abrir dashboard | Auto-connect com sessão em disco |
| 4. Enviar mensagem ao grupo | `messages.upsert` → banco → API |
| 5. Abrir `/dashboard/messages` | Mensagem visível; banner `CONNECTED` |

**Sem novo QR** após restart quando `creds.json` válido permanece em `WHATSAPP_SESSION_PATH`.

---

## Harnesses RC-03

| Harness | Valida |
|---|---|
| `StartupReconnectHarness` | instrumentation + bootstrap + auto-connect |
| `SessionRestoreHarness` | rotas connect/reconnect/reset-session |
| `PipelineBootstrapHarness` | pipelines no bootstrap |
| `ChatDiscoveryHarness` | persistência via onChatDiscovered |
| `StatusApiHarness` | campos operacionais + banner |

---

## Arquivos principais

- `apps/dashboard/src/instrumentation.ts`
- `apps/dashboard/src/lib/server-ready.ts`
- `apps/dashboard/src/lib/whatsapp/runtime.ts`
- `apps/dashboard/src/app/api/whatsapp/{connect,reconnect,reset-session,status}/route.ts`
- `apps/dashboard/src/components/whatsapp/diagnostic-banner.tsx`
- `packages/whatsapp/src/providers/baileys-connection-diagnostic.ts`
- `packages/whatsapp/src/utils/group-discovery.ts`
- `harness/rc-03/index.ts`

---

## Validação automatizada

```bash
pnpm test:unit
pnpm harness
pnpm typecheck
pnpm lint
```

---

## Limitações remanescentes

1. Auto-connect depende de sessão Baileys válida em disco — sessão expirada/revogada exige `reset-session` + novo QR.
2. `InMemoryEventBus` e jobs de pipeline continuam voláteis entre restarts (comportamento Epic 05).
3. Teste físico com aparelho WhatsApp real permanece validação manual do operador.
