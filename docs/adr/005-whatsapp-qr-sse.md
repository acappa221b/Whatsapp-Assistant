# ADR-005 — Estratégia de Atualização de QR Code WhatsApp

**Status:** Aceito  
**Data:** 2025-06-22  
**Epic:** 04

## Contexto

O pareamento Baileys exige exibição de QR Code no dashboard com atualização em tempo quase real enquanto a sessão está em estado `qr`.

Alternativas consideradas:

1. **Server-Sent Events (SSE)** — stream unidirecional servidor → browser
2. **WebSocket** — canal bidirecional full-duplex

## Decisão

Adotar **SSE** via rota `GET /api/whatsapp/events`.

## Motivos

| Critério | SSE | WebSocket |
|----------|-----|-----------|
| Direção do fluxo | Unidirecional (suficiente para status/QR) | Bidirecional (desnecessário) |
| Integração Next.js Route Handlers | Nativa com `ReadableStream` | Requer servidor WS dedicado ou adapter |
| Complexidade operacional | Baixa | Média |
| Reconexão automática | Suportada pelo `EventSource` | Manual |
| Infra Railway/Docker MVP | Sem portas extras | Pode exigir sticky sessions |

## Implementação

1. `BaileysWhatsappProvider` emite mudanças de status via `onStatusChange`.
2. `apps/dashboard/src/lib/whatsapp/runtime.ts` mantém listeners SSE in-memory.
3. `GET /api/whatsapp/events` envia payload JSON:

```json
{
  "status": "qr",
  "qrCode": "...",
  "qrCodeDataUrl": "data:image/png;base64,...",
  "lastConnectedAt": null,
  "messageCount": 0
}
```

4. Página `/dashboard/whatsapp` usa `EventSource` para atualizar QR e status.

## Consequências

- QR Code atualiza automaticamente sem polling agressivo.
- SSE funciona bem para MVP local e deploy simples.
- Se no futuro precisarmos de comandos bidirecionais em tempo real (ex.: chat ao vivo), reavaliar WebSocket em ADR separado.

## Referências

- [docs/whatsapp/provider.md](../whatsapp/provider.md)
- [docs/whatsapp/overview.md](../whatsapp/overview.md)
