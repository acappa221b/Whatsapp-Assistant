# ADR-002: Event Driven Architecture

**Status:** Aceito  
**Data:** 2025-06-22  
**Versão:** 0.0.1

## Contexto

O fluxo WhatsApp → IA → Validação → Banco → Dashboard envolve múltiplos módulos que não devem acoplar regras de negócio diretamente.

## Decisão

Implementar **Event Bus interno** no pacote `@finance-ai/core`:

```typescript
interface EventBus {
  publish(event: DomainEvent): Promise<void>
  subscribe(eventName, handler): () => void
}
```

Implementação inicial: `InMemoryEventBus` (processo único).

### Eventos v1

- `MessageReceived`, `ImageReceived`
- `ExpenseDetected`, `ExpenseApproved`, `ExpenseRejected`
- `ExcelGenerated`

## Alternativas consideradas

| Alternativa | Motivo rejeição |
|-------------|-----------------|
| Chamadas diretas entre services | Alto acoplamento |
| Redis/RabbitMQ no MVP | Complexidade infra prematura |
| Webhooks HTTP internos | Overhead desnecessário local |

## Consequências

- Handlers registrados na inicialização da aplicação
- Futuro: adapter para Redis/BullMQ sem mudar contratos de domínio
- Testes unitários isolam handlers via bus mock

## Evolução futura

Quando escalar para múltiplas instâncias, substituir `InMemoryEventBus` por broker externo mantendo interface `EventBus`.

## Referências

- `packages/core/src/events/index.ts`
