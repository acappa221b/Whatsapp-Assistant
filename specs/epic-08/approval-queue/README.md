# Approval Queue — Especificacao de Dominio e UI

**Epic:** 08  
**Entidade principal:** ApprovalQueue / ApprovalDecision  
**Versao:** 1.0.0

## Objetivo

Definir a fila de aprovacao para candidatos financeiros pendentes, com operacoes por item, operacoes em massa, edicao previa e trilha de auditoria obrigatoria.

## Definicao

`ApprovalQueue` e uma projecao operacional dos `FinancialCandidate`s e seus `CandidateItem`s pendentes. `ApprovalDecision` e o registro imutavel de cada acao humana sobre um item ou lote de itens.

## Campos

### Approval Queue View

| Campo | Origem | Obrigatorio | Observacoes |
|---|---|---|---|
| `candidateId` | FinancialCandidate | Sim | ID exibido/operado |
| `sourceMessageId` | FinancialCandidate | Sim | Vinculo com mensagem original |
| `messageContent` | WhatsappMessage | Sim | Texto original quando existir |
| `originalFile` | WhatsappMessage/Storage | Nao | URL/preview para image, document, audio |
| `candidateType` | FinancialCandidate | Sim | EXPENSE, REVENUE ou MIXED |
| `confidence` | FinancialCandidate | Sim | Consolidada |
| `status` | FinancialCandidate | Sim | Principalmente `PENDING` na queue |
| `items` | CandidateItem[] | Sim | Itens detectados |
| `createdAt` | FinancialCandidate | Sim | Ordenacao |
| `selectedItemIds` | UI state | Nao | Suporte a acoes em massa |

### ApprovalDecision

| Campo | Tipo | Obrigatorio | Regras |
|---|---|---|---|
| `id` | `string` | Sim | ID gerado |
| `candidateId` | `string` | Sim | FK logica |
| `itemId` | `string \| null` | Nao | Obrigatorio para acao individual; `null` em lote com detalhe separado |
| `decision` | `APPROVE \| REJECT \| EDIT_BEFORE_APPROVE` | Sim | Valor fechado |
| `userId` | `string` | Sim | Identifica o aprovador/revisor |
| `timestamp` | `Date` | Sim | Momento da acao |
| `comment` | `string \| null` | Nao | Comentario opcional |
| `changes` | `Record<string, unknown> \| null` | Nao | Snapshot das alteracoes feitas antes da aprovacao |

## Regras de Negocio

1. Apenas candidatos com pelo menos 1 item `PENDING` aparecem na queue padrao.
2. Aprovacao/rejeicao primaria ocorre por item.
3. Toda decisao gera um `ApprovalDecision` imutavel.
4. `comment` e opcional tanto em approve quanto reject.
5. `userId` e obrigatorio, mesmo sem auth externa formal nesta epic.
6. Um candidato sai da queue pendente apenas quando nao houver mais itens `PENDING`.
7. A UI deve exibir contexto suficiente para decidir sem abrir outras telas.
8. A acao deve ser idempotente do lado da API para evitar double submit.
9. Nenhuma decisao cria entidade financeira definitiva nesta epic.
10. Deve existir suporte a `Approve All`, `Reject All`, `Approve Selected` e `Reject Selected`.
11. Toda edicao feita antes da aprovacao deve ser auditada com diff/snapshot.
12. O operador pode editar completamente um item antes de aprovar.

## Invariantes

| ID | Invariante |
|---|---|
| INV-AQ-01 | queue padrao contem apenas candidatos com itens `PENDING` |
| INV-AQ-02 | toda decisao tem `userId` e `timestamp` |
| INV-AQ-03 | cada item decidido nao volta para `PENDING` sem nova spec |
| INV-AQ-04 | cada mutacao de decisao atualiza auditoria |
| INV-AQ-05 | `ApprovalDecision` nao e editavel apos criacao |

## Casos de Uso

| Caso de uso | Descricao |
|---|---|
| `ListApprovalQueue` | Lista candidatos pendentes com itens e origem |
| `ApproveCandidateItem` | Aprova um item pendente |
| `RejectCandidateItem` | Rejeita um item pendente |
| `ApproveAllCandidateItems` | Aprova todos os itens pendentes do candidato |
| `RejectAllCandidateItems` | Rejeita todos os itens pendentes do candidato |
| `ApproveSelectedCandidateItems` | Aprova subconjunto de itens selecionados |
| `RejectSelectedCandidateItems` | Rejeita subconjunto de itens selecionados |
| `EditCandidateItemInQueue` | Edita item antes da aprovacao |
| `ListApprovalHistory` | Lista decisoes de um candidato |
| `GetApprovalQueueItem` | Retorna detalhe para tela/modal |

## Eventos Emitidos

| Evento | Quando | Payload minimo |
|---|---|---|
| `CandidateApproved` | Todos os itens foram aprovados | `{ candidateId, userId, timestamp, comment }` |
| `CandidateRejected` | Todos os itens foram rejeitados | `{ candidateId, userId, timestamp, comment }` |
| `CandidateItemApproved` | Usuario aprova item | `{ candidateId, itemId, userId, timestamp, comment }` |
| `CandidateItemRejected` | Usuario rejeita item | `{ candidateId, itemId, userId, timestamp, comment }` |
| `CandidateItemEdited` | Usuario edita item | `{ candidateId, itemId, userId, timestamp, changes, comment }` |
| `CandidateBulkApproved` | Usuario aprova lote | `{ candidateId, itemIds, userId, timestamp, comment }` |
| `CandidateBulkRejected` | Usuario rejeita lote | `{ candidateId, itemIds, userId, timestamp, comment }` |
| `CandidateUpdated` | Detalhes da queue mudam por reprocessamento | `{ candidateId, changes }` |

## Dependencias

- `FinancialCandidate`
- `CandidateItem`
- `WhatsappMessage`
- `Extraction`
- `AuditLog` (ou mecanismo de auditoria equivalente)
- UI `/dashboard/approvals`

## Criterios de Aceite

### CA-AQ-01 — listar pendentes
- **Given** 5 candidatos, sendo 3 `PENDING`, 1 `APPROVED` e 1 `REJECTED`
- **When** `ListApprovalQueue` e chamado sem filtros
- **Then** apenas os 3 `PENDING` sao exibidos

### CA-AQ-02 — aprovar pela UI
- **Given** um candidato `PENDING` com 2 itens
- **When** o usuario clica em `Approve` em 1 item
- **Then** o backend registra `ApprovalDecision`, muda o item para `APPROVED` e recalcula o candidato agregado

### CA-AQ-03 — rejeitar com comentario opcional
- **Given** um candidato `PENDING`
- **When** o usuario clica em `Reject` com comentario
- **Then** a decisao e persistida com comentario e o item deixa de estar pendente

### CA-AQ-04 — mostrar arquivo original
- **Given** um candidato originado de `DOCUMENT`
- **When** a tela de approvals e aberta
- **Then** preview/download do arquivo original fica disponivel quando houver `storagePath`

### CA-AQ-05 — approve all
- **Given** um candidato com 3 itens pendentes
- **When** o usuario aciona `Approve All`
- **Then** todos os itens sao aprovados e o lote fica auditado

### CA-AQ-06 — approve selected
- **Given** um candidato com 4 itens pendentes
- **When** o usuario seleciona 2 itens e aciona `Approve Selected`
- **Then** apenas os 2 itens selecionados sao aprovados

### CA-AQ-07 — edicao antes da aprovacao
- **Given** um item pendente
- **When** o usuario altera valor, descricao ou categoria antes de aprovar
- **Then** a alteracao fica registrada em auditoria antes da decisao final

## Casos de Borda

| Cenario | Esperado |
|---|---|
| double click em Approve | apenas uma decisao efetiva |
| candidato reprocessado enquanto esta na fila | refletir `CandidateUpdated` e manter status coerente |
| arquivo original indisponivel | fila continua funcional com fallback visual |
| usuario rejeita sem comentario | permitido |
| queue vazia | estado vazio amigavel |
| comentario muito longo | validar limite na API/UI |
| approve selected com selecao vazia | bloquear acao |
| item ja aprovado em lote subsequente | ignorar ou falhar de forma idempotente |

## Estrategia de Testes

- Testes de listagem por status
- Testes de aprovar/rejeitar idempotentes
- Testes de auditoria obrigatoria
- Testes UI para renderizacao de itens e origem
- Testes de API PATCH/POST para decisoes
- Testes de acoes em massa e edicao previa
