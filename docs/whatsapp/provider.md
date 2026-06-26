# WhatsApp Provider — Baileys

**Implementação:** `BaileysWhatsappProvider`  
**Pacote:** `@finance-ai/whatsapp`

## Interface

```typescript
interface WhatsappProvider {
  connect(): Promise<void>
  disconnect(): Promise<void>
  getStatus(): WhatsappStatus
  onMessage(handler): () => void
  onStatusChange(handler): () => void
  sendMessage(message): Promise<void> // não implementado na Epic 04
}
```

## Status

| Estado | Descrição |
|--------|-----------|
| `disconnected` | Sem sessão ativa |
| `connecting` | Inicializando socket |
| `qr` | Aguardando scan do QR Code |
| `connected` | Sessão autenticada |

## Autenticação

Sessão multi-file em `.baileys_auth/` (gitignored).

## QR Code em tempo real

Ver [ADR-005](../adr/005-whatsapp-qr-sse.md) — SSE em `/api/whatsapp/events`.

## Mapeamento de mensagens

Utilitário `mapBaileysMessage` converte payload Baileys para domínio:

| Baileys | MessageType |
|---------|-------------|
| conversation / extendedText | TEXT |
| imageMessage | IMAGE |
| documentMessage | DOCUMENT |
| audioMessage | AUDIO |
| outros | UNKNOWN |

Mensagens `fromMe: true` são ignoradas.

## Composição no dashboard

```typescript
import { getWhatsappRuntime, ensureWhatsappPipelinesRegistered } from '@/lib/whatsapp/runtime'

ensureWhatsappPipelinesRegistered()
const { provider } = getWhatsappRuntime()
await provider.connect()
```

## Testes

Provider aceita `socketFactory` injetável para testes unitários sem rede.
