# Processors — Message Processing Pipeline

**Epic:** 05

## Interface

```typescript
interface MessageProcessor {
  readonly name: string
  canProcess(messageType: MessageType): boolean
  process(input: MessageProcessorInput): Promise<ProcessingResult>
}
```

## Implementações (stubs)

| Processor | messageType | Resultado |
|-----------|-------------|-----------|
| `TextMessageProcessor` | TEXT | PROCESSED |
| `ImageMessageProcessor` | IMAGE | PROCESSED |
| `DocumentMessageProcessor` | DOCUMENT | PROCESSED |
| `AudioMessageProcessor` | AUDIO | PROCESSED |
| `UnknownMessageProcessor` | fallback | SKIPPED |

## ProcessingResult

```typescript
{
  messageId: string
  processor: string
  status: 'PROCESSED' | 'FAILED' | 'SKIPPED'
  metadata: Record<string, unknown>  // { stub: true, messageType }
  processedAt: Date
  error?: string
}
```

## ProcessorResolver

`DefaultProcessorResolver` seleciona o primeiro processor cujo `canProcess()` retorna true. Se nenhum corresponder, usa `UnknownMessageProcessor`.

## Classifier

`MessageTypeClassifier` retorna o `messageType` já persistido na mensagem WhatsApp — sem inferência ou IA.

## Regras

- Processors **não** acessam WhatsApp diretamente
- Processors **não** criam Expense/Revenue
- Processors **não** chamam OpenAI ou OCR nesta epic
