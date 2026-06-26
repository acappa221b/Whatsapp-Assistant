# Eventos — Message Processing Pipeline

**Epic:** 05

## Eventos de domínio

| Evento | Quando | Payload principal |
|--------|--------|-------------------|
| `MessageQueued` | Mensagem entra na fila | `jobId`, `messageId`, `messageType` |
| `MessageProcessingStarted` | Processamento iniciado | `jobId`, `messageId`, `messageType` |
| `MessageProcessed` | Stub concluído com sucesso | `jobId`, `messageId`, `processor`, `metadata`, `durationMs` |
| `MessageFailed` | Erro no processor ou mensagem ausente | `jobId`, `messageId`, `error` |
| `MessageSkipped` | Tipo desconhecido / fallback | `jobId`, `messageId`, `processor`, `metadata` |

## Integração com Epic 04

```
WhatsappMessageReceived → persist → WhatsappMessagePersisted
                                         ↓
                              MessageProcessingPipeline
                                         ↓
                                   MessageQueued → ...
```

## Reprocessamento

`RequeueMessageUseCase` emite novo `MessageQueued` com `requeued: true` e executa o pipeline novamente.

## Handlers futuros

Epics posteriores podem subscrever `MessageProcessed` para acionar IA/OCR sem alterar o módulo WhatsApp.
