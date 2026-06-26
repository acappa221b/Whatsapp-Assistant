# WhatsApp — Visão Geral

**Epic:** 04  
**Pacote:** `@finance-ai/whatsapp`

## Objetivo

Receber mensagens reais do WhatsApp, persistir no SQLite e exibir no dashboard — **sem IA, OCR ou lançamentos financeiros**.

## Fluxo

```
WhatsApp (Baileys)
    ↓
BaileysWhatsappProvider
    ↓
WhatsappMessageReceived (Event Bus)
    ↓
StoreWhatsappMessage (Use Case)
    ↓
WhatsappMessagePrismaRepository
    ↓
SQLite
    ↓
Dashboard (/dashboard/messages)
```

## Componentes

| Camada | Responsabilidade |
|--------|------------------|
| `@finance-ai/whatsapp` | Provider Baileys, pipelines de eventos |
| `@finance-ai/core/domains/whatsapp-message` | Entidade, use cases, contratos |
| `@finance-ai/database` | Mapper + repositório Prisma |
| `apps/dashboard` | API routes, SSE, páginas UI |

## Páginas

- `/dashboard/whatsapp` — status, QR Code, conectar/desconectar
- `/dashboard/messages` — listagem de mensagens persistidas

## Eventos de conexão

- `WhatsappConnected` / `WhatsappDisconnected`

## Limitações (Epic 04)

- Sem envio de mensagens (`sendMessage` não implementado)
- Sem classificação financeira
- Sem integração OpenAI

## Próximo

Epic 05 — interpretação/classificação com IA.
