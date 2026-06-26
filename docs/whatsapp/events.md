# WhatsApp — Catálogo de Eventos

**Epic:** 04

## Conexão

### WhatsappConnected

Emitido quando Baileys atinge estado `connected`.

```typescript
{
  connectedAt: Date
}
```

### WhatsappDisconnected

Emitido quando a sessão retorna a `disconnected`.

```typescript
{
  disconnectedAt: Date
}
```

## Mensagens

### WhatsappMessageReceived

Emitido **antes** da persistência, quando o provider recebe uma mensagem inbound.

```typescript
{
  externalMessageId: string
  chatId: string
  sender: string
  content: string
  messageType: MessageType
  mediaUrl?: string | null
  receivedAt: Date
}
```

### WhatsappMessagePersisted

Emitido após `StoreWhatsappMessageUseCase` salvar com sucesso.

```typescript
{
  messageId: string
  externalMessageId: string
  messageType: MessageType
}
```

### WhatsappMessageFailed

Emitido quando a persistência falha (ex.: duplicata, erro de banco).

```typescript
{
  externalMessageId: string
  chatId: string
  error: string
}
```

### WhatsappMessageProcessed

Emitido após `MarkWhatsappMessageProcessedUseCase`.

```typescript
{
  messageId: string
  externalMessageId: string
}
```

## Eventos legados (Epics futuras)

- `MessageReceived` / `ImageReceived` — pipeline financeiro (Epic 05+)
- **Não utilizados na Epic 04**

## Ordem garantida (happy path)

1. `WhatsappMessageReceived`
2. `WhatsappMessagePersisted`
