# Financial Candidate — Especificacao de Dominio

**Epic:** 08  
**Entidade:** FinancialCandidate  
**Versao:** 1.0.0

## Objetivo

Representar um candidato financeiro auditavel derivado de uma `Extraction`, aguardando aprovacao explicita do usuario por item antes de qualquer ativacao do dominio financeiro definitivo.

## Definicao

`FinancialCandidate` e o agregado pai que conecta `WhatsappMessage` -> `Extraction` -> `CandidateItem[]` -> `ApprovalDecision[]`. Ele define o tipo financeiro agregado previsto (`EXPENSE`, `REVENUE` ou `MIXED`), o status agregado de aprovacao e a trilha de raciocinio consolidada.

## Campos

| Campo | Tipo | Obrigatorio | Regras |
|---|---|---|---|
| `id` | `string` | Sim | ID gerado pelo sistema |
| `sourceMessageId` | `string` | Sim | FK logica para `WhatsappMessage.id` |
| `extractionId` | `string` | Sim | FK logica para `Extraction.id`; um para um |
| `candidateType` | `EXPENSE \| REVENUE \| MIXED` | Sim | Derivado da extraction agregada |
| `status` | `PENDING \| PARTIALLY_APPROVED \| PARTIALLY_REJECTED \| APPROVED \| REJECTED \| MIXED_RESOLUTION` | Sim | Derivado dos itens |
| `confidence` | `number` | Sim | 0..1; agregado do candidato |
| `reasoning` | `string \| null` | Nao | Resumo consolidado do por que dos itens |
| `createdAt` | `Date` | Sim | Auto |
| `updatedAt` | `Date` | Sim | Atualizado em toda mutacao |

## Regras de Negocio

1. Todo `FinancialCandidate` nasce de exatamente uma `Extraction` valida.
2. Todo `FinancialCandidate` precisa ter pelo menos 1 `CandidateItem`.
3. `status` inicial obrigatorio: `PENDING`.
4. O estado agregado do candidato e calculado a partir dos estados dos itens.
5. `candidateType` precisa ser consistente com os itens associados e pode ser `MIXED`.
6. `confidence` agregado deve ser normalizado para `0..1`.
7. Um `extractionId` nao pode gerar mais de um candidato ativo concorrente sem evento explicito de update/substituicao.
8. `APPROVED` nao cria `Expense`/`Revenue` nesta epic.
9. Reprocessamento da mesma extraction pode gerar `CandidateUpdated`, nunca duplicata silenciosa.
10. Toda referencia de origem deve permanecer preservada para cada item aprovado: `WhatsappMessage`, `Extraction` e arquivo original.
11. O candidato deve suportar edicao previa de itens sem perder a trilha de auditoria.

## Invariantes

| ID | Invariante |
|---|---|
| INV-FC-01 | `status` pertence aos estados agregados definidos pela spec |
| INV-FC-02 | `confidence >= 0 && confidence <= 1` |
| INV-FC-03 | existe ao menos 1 `CandidateItem` vinculado |
| INV-FC-04 | `sourceMessageId` e `extractionId` sao imutaveis apos criacao |
| INV-FC-05 | `createdAt <= updatedAt` |
| INV-FC-06 | estados finais nao voltam para `PENDING` sem nova spec |

## Casos de Uso

| Caso de uso | Descricao |
|---|---|
| `CreateFinancialCandidate` | Cria candidato a partir de extraction estruturada |
| `GetFinancialCandidateById` | Consulta candidato com itens e decisoes |
| `ListFinancialCandidates` | Lista por status/tipo/origem |
| `UpdateFinancialCandidateFromExtraction` | Atualiza candidato apos reprocessamento controlado |
| `RecalculateCandidateStatus` | Recalcula estado agregado conforme decisoes por item |
| `ApplyBulkCandidateDecision` | Aprova/rejeita varios itens do mesmo candidato |

## Eventos Emitidos

| Evento | Quando | Payload minimo |
|---|---|---|
| `CandidateCreated` | Criacao inicial | `{ candidateId, extractionId, sourceMessageId, candidateType, itemCount, status }` |
| `CandidateUpdated` | Reprocessamento/ajuste estrutural | `{ candidateId, extractionId, changes, itemCount }` |
| `CandidateApproved` | Todos os itens foram aprovados | `{ candidateId, userId, timestamp, comment }` |
| `CandidateRejected` | Todos os itens foram rejeitados | `{ candidateId, userId, timestamp, comment }` |

## Dependencias

- `WhatsappMessage`
- `Extraction`
- `CandidateItem`
- `ApprovalDecision`
- `EventBus`

## Criterios de Aceite

### CA-FC-01 — criar candidato multi-item
- **Given** uma extraction contendo `items[]` com 3 itens validos
- **When** `CreateFinancialCandidate` e executado
- **Then** um candidato `PENDING` e criado com 3 `CandidateItem`s e evento `CandidateCreated`

### CA-FC-02 — impedir candidato vazio
- **Given** uma extraction sem itens validos
- **When** `CreateFinancialCandidate` e executado
- **Then** a operacao falha por validacao e nada e persistido

### CA-FC-03 — resolucao parcial
- **Given** um candidato `PENDING` com 2 itens
- **When** apenas 1 item e aprovado
- **Then** o candidato muda para `PARTIALLY_APPROVED` ou estado agregado equivalente

### CA-FC-04 — candidato misto
- **Given** uma extraction com itens `EXPENSE` e `REVENUE`
- **When** `CreateFinancialCandidate` e executado
- **Then** `candidateType = MIXED`

### CA-FC-05 — conclusao total
- **Given** um candidato com todos os itens aprovados
- **When** o estado agregado e recalculado
- **Then** o candidato muda para `APPROVED`

## Casos de Borda

| Cenario | Esperado |
|---|---|
| confidence agregada ausente | recalcular a partir dos itens ou rejeitar payload |
| extraction UNKNOWN | nao criar candidato financeiro |
| extraction com tipo misto | criar candidato `MIXED` |
| itens duplicados textualmente | permitir, pois podem representar compras distintas |
| comentario de aprovacao vazio | permitido |
| candidato sem reasoning consolidado | permitido como `null` |
| parte dos itens aprovada e parte rejeitada | estado agregado `MIXED_RESOLUTION` |

## Estrategia de Testes

- Testes de entidade para transicao de status agregado
- Testes de use case para criacao multi-item
- Testes de idempotencia por `extractionId`
- Testes de eventos emitidos
- Testes de integracao com approval queue sem criar entidades financeiras
- Testes de resolucao parcial e em massa
