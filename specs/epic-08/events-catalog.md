# Catalogo de Eventos — Epic 08

**Versao:** 1.0.0  
**Transporte:** Event Bus interno (ADR-002)

Todos os eventos seguem a estrutura base:

```typescript
interface DomainEvent<TPayload> {
  name: DomainEventName
  payload: TPayload
  occurredAt: Date
  correlationId?: string
  causationId?: string
}
```

---

## Eventos obrigatorios da epic

| Evento | Descricao | Payload |
|---|---|---|
| `CandidateCreated` | Um novo `FinancialCandidate` foi criado a partir de uma `Extraction` valida | `{ candidateId: string, extractionId: string, sourceMessageId: string, candidateType: 'EXPENSE' | 'REVENUE' | 'MIXED', itemCount: number, confidence: number, status: 'PENDING' }` |
| `CandidateUpdated` | Um candidato pendente foi atualizado por reprocessamento/ajuste estrutural | `{ candidateId: string, extractionId: string, itemCount: number, changes: Record<string, unknown> }` |
| `CandidateApproved` | Todos os itens do candidato foram aprovados | `{ candidateId: string, userId: string, timestamp: Date, comment?: string | null }` |
| `CandidateRejected` | Todos os itens do candidato foram rejeitados | `{ candidateId: string, userId: string, timestamp: Date, comment?: string | null }` |
| `CandidateItemApproved` | Um item foi aprovado | `{ candidateId: string, itemId: string, userId: string, timestamp: Date, comment?: string | null }` |
| `CandidateItemRejected` | Um item foi rejeitado | `{ candidateId: string, itemId: string, userId: string, timestamp: Date, comment?: string | null }` |
| `CandidateItemEdited` | Um item foi editado antes da aprovacao | `{ candidateId: string, itemId: string, userId: string, timestamp: Date, changes: Record<string, unknown>, comment?: string | null }` |
| `CandidateBulkApproved` | Um conjunto de itens foi aprovado em massa | `{ candidateId: string, itemIds: string[], userId: string, timestamp: Date, comment?: string | null }` |
| `CandidateBulkRejected` | Um conjunto de itens foi rejeitado em massa | `{ candidateId: string, itemIds: string[], userId: string, timestamp: Date, comment?: string | null }` |

---

## Eventos de entrada relacionados

| Evento existente | Origem | Papel na Epic 08 |
|---|---|---|
| `WhatsappMessagePersisted` | Epic 04 | origem inicial da mensagem |
| `MessageProcessed` | Epic 05 | confirma fim do processor |
| `ExtractionCreated` | Epic 06 | gatilho principal para criar `FinancialCandidate` |
| `MessageSkipped` | Epic 05 | nao deve criar candidato |

---

## Cadeia de eventos alvo

```text
WhatsappMessagePersisted
-> MessageProcessed
-> ExtractionCreated
-> CandidateCreated
-> CandidateItemEdited?
-> CandidateItemApproved | CandidateItemRejected
-> CandidateApproved | CandidateRejected
```

Quando houver reprocessamento controlado:

```text
ExtractionCreated (nova versao/logica)
-> CandidateUpdated
```

---

## Regras de emissao

1. `CandidateCreated` so pode ocorrer quando a extraction tiver `items[]` validos e tipo financeiro conhecido.
2. `CandidateUpdated` so pode ocorrer para candidato ainda com itens editaveis/pendentes, salvo spec futura.
3. `CandidateApproved` e `CandidateRejected` sao estados agregados derivados dos itens.
4. `CandidateItemApproved` e `CandidateItemRejected` sao os eventos primarios de decisao humana.
5. `CandidateApproved` nao cria `Expense`/`Revenue` nesta epic.
6. Todos os eventos devem carregar ids suficientes para auditoria e troubleshooting.

---

## Contratos de payload

### CandidateCreated

```json
{
  "candidateId": "fc_123",
  "extractionId": "ext_123",
  "sourceMessageId": "msg_123",
  "candidateType": "MIXED",
  "itemCount": 2,
  "confidence": 0.89,
  "status": "PENDING"
}
```

### CandidateItemApproved

```json
{
  "candidateId": "fc_123",
  "itemId": "ci_001",
  "userId": "usr_123",
  "timestamp": "2026-06-25T09:00:00.000Z",
  "comment": "ok"
}
```

---

## Observabilidade e auditoria

- `correlationId` deve permitir rastrear `WhatsappMessage -> Extraction -> Candidate -> Item -> Decision`
- `CandidateItemEdited`, `CandidateItemApproved`, `CandidateItemRejected`, `CandidateBulkApproved` e `CandidateBulkRejected` devem ser espelhados em `AuditLog` ou mecanismo equivalente de auditoria
- Logs da UI/API nao substituem os eventos de dominio

---

## Compatibilidade futura com Epic 09

A Epic 09 deve consumir itens aprovados e/ou o estado agregado final para materializar `Expense` ou `Revenue`, sem redefinir o contrato desta epic.
