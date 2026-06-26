# RC-04 — Investigação do fluxo de eventos do QR Code

Data: 2026-06-24  
Versão app: `0.0.9`  
Script de apoio: `scripts/rc-04-qr-flow-trace.ts`  
Prefixo de logs temporários: `[rc04/trace]`

## Resumo executivo

O pipeline **Baileys → Provider → API → SSE** está **íntegro**: o QR é emitido, convertido para Data URL válida e exposto pela API em ~1 s após `POST /connect`.

A quebra percebida pelo usuário (**"carregando..." persistente** e **QR não renderizado**) ocorre na **Etapa 4 — Frontend** (`/dashboard/whatsapp`), por combinação de:

1. Estado React inicial `null` renderizado como literal `"carregando..."` até o primeiro `GET /status` completar (2 s+ no cold start).
2. `connect()` faz **um único** `GET /status` imediatamente após o POST, quando o provider ainda está em `connecting` **sem** `qrCodeDataUrl` (~600 ms antes do QR existir).
3. Dependência quase exclusiva do **SSE** para receber o QR após clicar Conectar; polling de fallback a cada **10 s** é insuficiente.
4. Ausência de `.catch()` no fetch inicial (código original) — falha de rede deixa `status === null` **indefinidamente** → `"carregando..."` eterno.

**Etapas 1–3: OK | Etapa 4: QUEBRA**

---

## Mapa do pipeline

```
Baileys socket.ev('connection.update')
  → baileys-socket.factory onQr(qr)
  → BaileysWhatsappProvider.handleQr()
      → qrcode.toDataURL(qr)
      → updateStatus({ status:'qr', qrCode, qrCodeDataUrl })
  → notifyStatusHandlers()
  → subscribeWhatsappStatus (SSE) + GET /api/whatsapp/status
  → page.tsx setStatus()
  → <img src={status.qrCodeDataUrl} />
```

---

## FASE 1 — Resultados por etapa

### Etapa 1 — Baileys (origem) ✅

**Pergunta:** O Baileys emite `qr`?

**Resposta:** Sim.

| Campo | Valor observado |
|---|---|
| `hasQr` | `true` |
| `qrLength` | `237` |
| `qrPrefix` | `2@gzxJb4Ghmj` (formato padrão `2@...`) |
| Momento | `2026-06-24T12:11:45.940Z` (~906 ms após `connecting`) |

Log:
```
[rc04/trace] baileys :: connection.update:raw-entry
  hasQr: true, qrLength: 237, qrPrefix: '2@gzxJb4Ghmj', connection: null
```

---

### Etapa 2 — Provider (memória) ✅

**Pergunta:** O QR é gravado ou sobrescrito por `connecting`?

**Resposta:** Gravado corretamente; `connecting` só zera QR **no início** de `startConnection()`, antes do evento `qr`.

Sequência `updateStatus`:

| Hora (UTC) | before.status | after.status | qrCodeDataUrl |
|---|---|---|---|
| 12:11:44.624 | disconnected | **connecting** | ausente (reset esperado) |
| 12:11:45.997 | connecting | **qr** | presente (6334 chars) |

Log pós-gravação:
```
[rc04/trace] provider :: handleQr:state-after-update
  status: 'qr', qrCodeLength: 237, qrCodeDataUrlLength: 6334
```

Data URL válida: `data:image/png;base64,iVBORw0KGg...`

---

### Etapa 3 — API (consulta) ✅

**Pergunta:** A API devolve QR null ou Data URL inválida?

**Resposta:** Devolve string válida quando o provider está em `qr`.

| Momento | status | qrCodeDataUrl |
|---|---|---|
| POST /connect (imediato) | `connecting` | `null` (esperado — QR ainda não gerado) |
| GET /status poll 1 (+605 ms) | `connecting` | `null` |
| GET /status poll 2 (+1.1 s) | `qr` | `6334` chars, prefixo `data:image/png;base64,...` |
| SSE push | `qr` | `6334` chars |

Log:
```
[rc04/trace] api-status :: GET-response
  status: 'qr', qrCodeDataUrlLength: 6334, qrCodeDataUrlPrefix: 'data:image/png;base64,iVBORw0KGg'
```

Conversão Base64: **sem falha silenciosa**.

---

### Etapa 4 — Frontend (consumo) ❌

**Pergunta:** Por que `"carregando..."` e QR não aparecem?

**Resposta:** Problemas de consumo/UX no componente, não de backend.

#### 4a — `"carregando..."` persistente

```tsx
<strong>{status?.status ?? 'carregando...'}</strong>
```

| Condição | UI exibida |
|---|---|
| `status === null` | **"carregando..."** |
| `status.status === 'connecting'` | "connecting" |
| `status.status === 'qr'` + sem dataUrl | "Gerando QR Code..." |

`status` inicia como `null`. O primeiro `GET /api/whatsapp/status` levou **2000 ms** no cold start (compilação webpack do Baileys). Durante esse intervalo a UI mostra `"carregando..."`.

Se o fetch falhar (sem `.catch` no código original), `status` permanece `null` → **carregando eterno**.

#### 4b — QR não renderizado após Conectar

```tsx
{status?.qrCodeDataUrl ? <img ... /> : <p>...</p>}
```

Fluxo atual de `connect()`:

```tsx
await fetch('/api/whatsapp/connect', { method: 'POST' })
const data = await fetch('/api/whatsapp/status').then(...)
setStatus(data)  // único snapshot — frequentemente ANTES do QR
```

Timeline medida:

| Hora | Evento | qrCodeDataUrl |
|---|---|---|
| 12:11:45.034 | POST /connect retorna | null |
| 12:11:45.639 | GET /status (poll 1 / connect snapshot) | null, status=connecting |
| 12:11:45.997 | SSE push + provider qr | **presente** |
| 12:11:46.164 | GET /status poll 2 | presente |

O clique em Conectar **não aguarda** o QR. O único `setStatus` pós-connect captura `connecting` sem imagem. O QR **só chega ao UI via SSE** (~960 ms depois) — se o EventSource estiver ativo e o componente não sobrescrever o estado.

#### 4c — Polling e SSE

| Mecanismo | Intervalo | Adequação |
|---|---|---|
| EventSource `/api/whatsapp/events` | push em tempo real | **Correto** — entrega QR em ~1 s |
| `setInterval` fetch status | **10 000 ms** | **Insuficiente** como fallback |
| `connect()` fetch | **1× imediato** | **Antecede o QR** — snapshot prematuro |

#### 4d — SSE handler

O handler propaga `qrCodeDataUrl` corretamente:

```tsx
setStatus((current) => ({
  ...payload,
  messageCount: current?.messageCount ?? payload.messageCount,
}))
```

Não há renomeação de campo no JSON. Tipagem `WhatsappStatusPayload` está alinhada com a API.

---

## Linha do tempo consolidada (UTC)

```
12:11:41.601  [script] start
12:11:43.632  GET /status (initial) → disconnected (T+2.0s, cold compile)
12:11:44.058  POST /disconnect
12:11:44.623  SSE → disconnected
12:11:44.624  provider → connecting (QR zerado)
12:11:44.963  SSE → connecting
12:11:45.034  POST /connect → connecting, qr=null
12:11:45.639  GET /status poll 1 → connecting, qr=null
12:11:45.940  baileys raw-entry → hasQr=true, qrLength=237
12:11:45.997  provider handleQr → dataUrl 6334 chars
12:11:45.997  provider updateStatus → qr
12:11:45.997  SSE → qr, qrCodeDataUrlLength=6334
12:11:46.164  GET /status poll 2 → qr, qrCodeDataUrlLength=6334
```

---

## Etapa que quebra a corrente

| # | Etapa | Status |
|---|---|---|
| 1 | Baileys emite `qr` | ✅ OK |
| 2 | Provider armazena + Data URL | ✅ OK |
| 3 | API / SSE expõem QR | ✅ OK |
| 4 | Frontend consome e renderiza | ❌ **QUEBRA** |

---

## Proposta de correção cirúrgica (não aplicada)

Escopo restrito a `apps/dashboard/src/app/dashboard/whatsapp/page.tsx` — sem alterar regras de negócio do provider.

### Fix A — Eliminar `"carregando..."` enganoso

Inicializar estado com valor default em vez de `null`:

```tsx
const [status, setStatus] = useState<WhatsappStatusPayload>({
  status: 'disconnected',
  qrCode: null,
  qrCodeDataUrl: null,
  lastConnectedAt: null,
  messageCount: 0,
})
```

Ou exibir `"aguardando..."` apenas enquanto `isLoadingInitial` for true.

### Fix B — `connect()` aguardar QR (polling curto pós-connect)

Após `POST /connect`, fazer polling de `GET /status` a cada 300–500 ms por até 10 s até `status === 'qr' && qrCodeDataUrl`, **ou** confiar no SSE sem sobrescrever com snapshot stale.

### Fix C — Não sobrescrever estado mais novo

Em `setStatus` pós-connect, mesclar preferindo QR:

```tsx
setStatus((current) => ({
  ...data,
  qrCodeDataUrl: data.qrCodeDataUrl ?? current?.qrCodeDataUrl ?? null,
  status: data.qrCodeDataUrl ? 'qr' : data.status,
}))
```

### Fix D — Polling adaptativo

Reduzir intervalo para 2 s quando `status` for `connecting` ou `qr` (em vez de 10 s fixo).

### Fix E — Tratamento de erro no fetch inicial

```tsx
.catch(() => setStatus({ status: 'disconnected', ... }))
```

---

## Instrumentação temporária adicionada (RC-04)

| Arquivo | Logs |
|---|---|
| `packages/whatsapp/src/providers/qr-flow-trace.ts` | helper `traceQrFlow` |
| `baileys-socket.factory.ts` | entrada raw `connection.update` |
| `baileys.provider.ts` | `handleQr`, `updateStatus` before/after |
| `api/whatsapp/status/route.ts` | payload da resposta |
| `api/whatsapp/events/route.ts` | cada push SSE |
| `dashboard/whatsapp/page.tsx` | console `[rc04/trace] frontend` |

**Remover ou desativar** após aplicar a correção definitiva.

---

## Próximo passo

Aguardando aprovação para aplicar **Fix A + B + E** (mínimo recomendado) sem iniciar Epic 08.
