# RC-02 — Diagnóstico Baileys (`connection.update`)

Data: 2026-06-24  
Versão app: `0.0.9`  
Script de apoio: `scripts/rc-02-baileys-connect-attempt.ts`  
Logs instrumentados em: `packages/whatsapp/src/providers/baileys-connection-diagnostic.ts`

## Resumo executivo

A tentativa real de conexão WhatsApp **falha antes de gerar QR**. O socket Baileys emite `connection: connecting` e fecha em ~300 ms com erro **`bufferUtil.mask is not a function`**. Não há `statusCode` HTTP/Boom — `lastDisconnect.error.output` é `null`.

Consequência: o provider nunca recebe QR, o dashboard nunca exibe `qrCodeDataUrl`, e o loop de auto-reconnect (`WHATSAPP_AUTO_RECONNECT=true`, delay 5 s) repete o mesmo erro indefinidamente.

## Ambiente da tentativa

| Item | Valor |
|---|---|
| Dashboard URL | `http://localhost:4000` |
| Início do teste | `2026-06-24T10:43:56.421Z` |
| `@whiskeysockets/baileys` (lockfile / pnpm) | **6.17.16** |
| Declarado em `packages/whatsapp/package.json` | `^6.7.9` |
| Sessão absoluta | `C:\Dev\Dashboard-UNIQUE\storage\whatsapp` |
| `WHATSAPP_AUTO_RECONNECT` | `true` |
| `WHATSAPP_RECONNECT_DELAY_MS` | `5000` |

## Sessão WhatsApp (auth state)

Momento do carregamento (`useMultiFileAuthState`):

```json
{
  "baileysVersion": "unknown",
  "stateLoaded": true,
  "hasCreds": true,
  "sessionAbsolutePath": "C:\\Dev\\Dashboard-UNIQUE\\storage\\whatsapp",
  "sessionExists": true,
  "sessionFileCount": 0,
  "sessionFiles": []
}
```

| Pergunta | Resposta |
|---|---|
| Diretório existe? | Sim (`mkdirSync` + path resolvido) |
| Arquivos de sessão no disco? | **Não** (`fileCount: 0`) |
| `hasCreds: true` significa sessão válida? | **Não** — Baileys retorna objeto `creds` default mesmo sem arquivos; não há `creds.json` nem chaves persistidas |

**Conclusão:** não há sessão persistida válida; seria necessário QR para novo pareamento — mas o WebSocket cai antes do QR ser emitido.

## Sequência `connection.update` (1º ciclo — representativo)

Todos os ciclos observados (10+) repetem o mesmo padrão.

### Evento 1 — `connecting`

```json
{
  "receivedAt": "2026-06-24T10:43:59.903Z",
  "connection": "connecting",
  "qrPresent": false,
  "qrLength": 0,
  "qrPreview": null,
  "isNewLogin": null,
  "legacy": null,
  "lastDisconnect": null,
  "rawKeys": ["connection", "receivedPendingNotifications", "qr", "receivedAt"]
}
```

### Evento 2 — `close` (~307 ms depois)

```json
{
  "receivedAt": "2026-06-24T10:44:00.210Z",
  "connection": "close",
  "qrPresent": false,
  "qrLength": 0,
  "qrPreview": null,
  "isNewLogin": null,
  "legacy": null,
  "lastDisconnect": {
    "error": {
      "message": "bufferUtil.mask is not a function",
      "output": null,
      "data": null
    }
  },
  "rawKeys": ["connection", "lastDisconnect", "receivedAt"]
}
```

### Campos solicitados (disconnect)

| Campo | Valor |
|---|---|
| `connection` | `close` |
| `qr` | ausente (`qrPresent: false`) |
| `lastDisconnect` | presente |
| `lastDisconnect.error` | presente |
| `lastDisconnect.error.message` | **`bufferUtil.mask is not a function`** |
| `lastDisconnect.error.output` | **`null`** |
| `lastDisconnect.error.output.statusCode` | **`null`** (output inexistente) |

## Provider e dashboard

### Timeline API (`GET /api/whatsapp/status`, poll 2 s)

| Momento | Status API | QR presente |
|---|---|---|
| `10:43:56` | `disconnected` | não |
| `10:43:58` connect → | `connecting` | não |
| `10:44:01` | `disconnected` | não |
| `10:44:03` … `10:44:20` | `disconnected` (reconnect loop) | não |
| `10:44:22` | `connecting` (novo ciclo) | não |
| `10:44:24` … `10:44:30` | `disconnected` | não |

### QR no provider

Nenhum log `[baileys/diagnostic] provider qr received` foi emitido em toda a execução.

### QR no dashboard

`qrCodeDataUrl` permaneceu `null` em todos os polls e na resposta de `POST /api/whatsapp/connect`.

## Respostas RC-02 (checklist)

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Log completo `connection.update` | Ver seção **Sequência** acima; padrão idêntico em 10+ ciclos |
| 2 | Motivo exato do disconnect | **`bufferUtil.mask is not a function`** — falha na camada WebSocket (`ws` + `bufferutil`) |
| 3 | StatusCode retornado | **`null`** — erro não é Boom/HTTP; `error.output` ausente |
| 4 | QR foi gerado? | **Não** — nenhum evento com `qrPresent: true` |
| 5 | QR chegou ao provider? | **Não** — sem `provider qr received` |
| 6 | QR chegou ao dashboard? | **Não** — `qrCodeDataUrl` sempre `null` |
| 7 | Sessão existente considerada válida? | **Não** — diretório vazio (`fileCount: 0`); `hasCreds` é default do Baileys |
| 8 | Versão exata `@whiskeysockets/baileys` | **6.17.16** (resolvida pelo lockfile; runtime log retorna `unknown` por limitação do bundle Next/webpack em `require.resolve`) |

## Hipótese de causa raiz (sem correção aplicada)

O erro `bufferUtil.mask is not a function` indica que o módulo nativo opcional `bufferutil` (dependência de `ws`, usado pelo Baileys) **não está disponível ou foi incorretamente empacotado** pelo bundler do Next.js em runtime de API routes.

`next.config.ts` já marca `@whiskeysockets/baileys` em `serverExternalPackages`, mas `ws` / `bufferutil` podem ainda ser resolvidos de forma incompatível dentro do grafo webpack.

**Nota:** correções ficam fora do escopo RC-02 (diagnóstico apenas).

## Instrumentação adicionada (RC-02)

| Arquivo | O que registra |
|---|---|
| `baileys-connection-diagnostic.ts` | `auth state load`, `connection.update` serializado, QR no provider, mudanças de status |
| `baileys-socket.factory.ts` | Hook em `socket.ev.on('connection.update')` |
| `baileys.provider.ts` | `connect start` (inspeção de sessão), QR recebido, status change |

Prefixo de log: `[baileys/diagnostic]`

## Como reproduzir

```bash
# Terminal 1
pnpm dev

# Terminal 2
npx tsx scripts/rc-02-baileys-connect-attempt.ts
```

Observar stdout do `@finance-ai/dashboard:dev` para entradas `[baileys/diagnostic]`.
