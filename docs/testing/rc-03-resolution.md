# RC-03 — Resolução do loop Baileys e validação local

Data: 2026-06-24  
Versão app: `0.0.9`  
Pré-requisito: [RC-02 baileys-connection-diagnostic.md](./baileys-connection-diagnostic.md)

## Resumo executivo

O loop `connecting → disconnected` foi causado por **dois problemas em camadas distintas**:

1. **Empacotamento Next.js / WebSocket** — `bufferUtil.mask is not a function` (webpack stub de `bufferutil`).
2. **Handshake WhatsApp** — após corrigir (1), o servidor retornava `405 Connection Failure` por versão WA Web desatualizada no socket (sem `fetchLatestBaileysVersion`).

Com as correções, `connection.update` emite QR, o provider propaga `status: "qr"` com `qrCodeDataUrl`, e `GET /api/whatsapp/status` retorna o Data URL (~6 KB).

**Teste físico com aparelho:** aguardando comando do operador (fora do escopo automatizado desta RC).

---

## FASE 1 — Correção do empacotamento (Next.js + ws)

### Alterações em `apps/dashboard/next.config.ts`

| Medida | Detalhe |
|---|---|
| `serverExternalPackages` | Inclusão de `ws`, `bufferutil`, `utf-8-validate` além de `@whiskeysockets/baileys` |
| `webpack` (server) | `resolve.alias` com `bufferutil: false` e `utf-8-validate: false` — evita stub quebrado; `ws` usa fallback JS seguro |
| `webpack` (server) | `externals` adicionais para `ws`, `bufferutil`, `utf-8-validate` |

### Dependências em `packages/whatsapp/package.json`

Instaladas como dependências diretas (binários nativos compilados via `node-gyp-build`):

- `ws@^8.18.0`
- `bufferutil@^4.0.9`
- `utf-8-validate@^6.0.5`

### Evidência — erro RC-02 eliminado

Antes: `lastDisconnect.error.message = "bufferUtil.mask is not a function"`  
Depois da Fase 1: WebSocket conecta; novo erro `405` (tratado na Fase 1b abaixo).

---

## FASE 1b — Versão WA Web (handshake pós-bufferutil)

### Alterações em `packages/whatsapp/src/providers/baileys-socket.factory.ts`

```typescript
const { version } = await fetchLatestBaileysVersion()
makeWASocket({
  auth: state,
  version,
  browser: Browsers.macOS('Finance AI'),
  syncFullHistory: false,
  ...
})
```

### Smoke test isolado (fora do Next.js)

Script: `scripts/rc-03-baileys-direct-smoke.ts`

```
baileys version 2.3000.1035194821 isLatest true
connection.update {"connection":"connecting",...}
connection.update {"qrPresent":true,"qrLength":237,...}
QR_OK 2@SONJc4CCg9bp3aBgsPzFlQvioLluDN
```

---

## FASE 2 — Reset seguro do ambiente local

### Provider (`baileys.provider.ts`)

| Método | Comportamento |
|---|---|
| `disconnect()` | `allowReconnect = false` — interrompe loop |
| `clearAuthState()` | `rmSync(authDir)` — remove sessão corrompida/vazia |
| `connectFresh()` | `disconnect` → `clearAuthState` → `connect` |

### Rota `POST /api/whatsapp/connect`

Passa a chamar `provider.connectFresh()` em vez de `connect()` isolado — cada tentativa manual parte de sessão limpa.

### Anti-loop adicional

Auto-reconnect desabilitado para:

- erros de infraestrutura (`bufferutil`, `utf-8-validate`)
- `statusCode === 405` (Connection Failure)
- `statusCode === 401` (logout — já existia)

---

## FASE 3 — Validação e logs de sucesso

### Sequência `connection.update` (via Next.js dev, 2026-06-24T10:55:14Z)

1. `connection: "connecting"` — `qrPresent: false`
2. `qrPresent: true`, `qrLength: 237` — QR emitido pelo Baileys
3. `[baileys/diagnostic] provider qr received` — provider recebeu QR
4. `provider status change` → `status: "qr"`, `qrCodeDataUrlPresent: true`

### API

```bash
POST /api/whatsapp/connect → { ok: true, status: "connecting", qrCodeDataUrl: null }
# ~1.5s depois
GET  /api/whatsapp/status  → { status: "qr", qrCodeDataUrl: "data:image/png;base64,..." }
# qrCodeDataUrl length observado: 6298
```

### Premissa proxy local sem autenticação

Mantida — nenhuma camada de auth/proxy HTTP foi adicionada às rotas WhatsApp. Endpoints continuam como proxy local direto (`/api/whatsapp/*`), conforme Epic 07 (modelo `local-proxy-no-auth`).

---

## Validação da engine

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ pass |
| `pnpm typecheck` | ✅ pass |
| `pnpm test:unit` | ✅ 246 testes |
| `pnpm harness` | ✅ 49 harnesses |
| `pnpm build` | ✅ pass (warnings sharp/baileys pré-existentes) |

### Testes unitários novos (`baileys.provider.test.ts`)

- `does not auto-reconnect on bufferutil infrastructure disconnect`
- `connectFresh resets auth and starts connecting`

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `apps/dashboard/next.config.ts` | externals + alias webpack |
| `packages/whatsapp/package.json` | `ws`, `bufferutil`, `utf-8-validate` |
| `packages/whatsapp/src/providers/baileys-socket.factory.ts` | `fetchLatestBaileysVersion`, `Browsers` |
| `packages/whatsapp/src/providers/baileys.provider.ts` | `connectFresh`, `clearAuthState`, anti-loop |
| `packages/whatsapp/src/index.ts` | interface `WhatsappProvider` estendida |
| `apps/dashboard/src/app/api/whatsapp/connect/route.ts` | `connectFresh()` |
| `packages/whatsapp/src/providers/baileys.provider.test.ts` | 2 testes RC-03 |
| `scripts/rc-03-baileys-direct-smoke.ts` | smoke Baileys fora do Next |

---

## Pendências (aguardando operador)

- [ ] Escanear QR com aparelho físico
- [ ] Confirmar `status: "connected"` após pareamento
- [ ] Confirmar persistência de sessão em `storage/whatsapp` após restart do servidor
