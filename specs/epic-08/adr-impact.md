# Impacto das ADRs na Epic 08

Referencia obrigatoria para implementacao de `FinancialCandidate`, `CandidateItem` e `ApprovalQueue`.

---

## ADR-001 — Arquitetura Geral

**Arquivo:** [docs/adr/001-general-architecture.md](../../docs/adr/001-general-architecture.md)

### Impacto

- Novos dominios devem viver em `packages/core/src/domains/`
- UI e Route Handlers ficam em `apps/dashboard/`, sem regra de negocio
- Specs em `specs/epic-08/` sao a fonte de verdade antes de qualquer codigo

### Decisoes derivadas Epic 08

| Decisao | Justificativa |
|---|---|
| Separar `financial-candidate`, `candidate-item` e `approval-queue` | isolamento de responsabilidade |
| `ApprovalDecision` como registro imutavel | auditabilidade |
| Handoff para Epic 09 via eventos | desacoplamento entre aprovacao e financeiro |
| Banco como fonte unica de verdade | coerencia com arquitetura existente |
| Excel como projecao derivada | sem competir com persistencia primaria |

---

## ADR-002 — Event Driven Architecture

**Arquivo:** [docs/adr/002-event-driven-architecture.md](../../docs/adr/002-event-driven-architecture.md)

### Impacto

- Criacao, edicao e decisao de candidatos devem publicar eventos de dominio
- UI nunca altera estado financeiro sem passar por use case + event bus
- Reprocessamento da extraction deve refletir `CandidateUpdated`

### Decisoes derivadas Epic 08

| Decisao | Detalhe |
|---|---|
| eventos de agregado e item | `CandidateCreated`, `CandidateUpdated`, `CandidateItemApproved`, `CandidateItemRejected`, `CandidateApproved`, `CandidateRejected` |
| Correlation entre mensagem e decisao | via `sourceMessageId`, `extractionId`, `candidateId` |
| Epic 09 consome evento de aprovacao | sem acoplamento direto nesta epic |
| acoes em massa viram eventos proprios | observabilidade e idempotencia |

---

## ADR-003 — SQLite MVP + PostgreSQL Future

**Arquivo:** [docs/adr/003-sqlite-postgresql.md](../../docs/adr/003-sqlite-postgresql.md)

### Impacto

- A spec deve prever persistencia simples no MVP e compativel com futura migracao
- Campos temporais e ids devem permanecer neutros para SQLite/PostgreSQL
- Multi-item sugere relacao pai-filho (`FinancialCandidate` 1:N `CandidateItem`)

### Decisoes derivadas Epic 08

| Decisao | Detalhe |
|---|---|
| IDs como `string` | compatibilidade Prisma |
| datas de decisao em `Date` | mapeadas na infra |
| itens normalizados em tabela propria | evita JSON opaco para aprovacao |
| historico de edicao como trilha separada | prepara auditoria e `Adjustment` futuro |

---

## ADR-006 — Processamento Desacoplado

**Arquivo:** [docs/adr/006-decoupled-processing.md](../../docs/adr/006-decoupled-processing.md)

### Impacto

- O pipeline de mensagens nao deve criar entidades financeiras finais
- `ExtractionCreated` passa a alimentar pipeline de candidatos
- Reprocessamento deve ser seguro e observavel

### Decisoes derivadas Epic 08

| Decisao | Detalhe |
|---|---|
| Novo pipeline `Extraction -> Candidate` | separado do pipeline financeiro |
| `MessageSkipped` nao cria candidato | governanca preservada |
| suporte a `TEXT`, `IMAGE`, `DOCUMENT`, `AUDIO` | via extraction multimodal |
| aprovacao por item | permite resolucao parcial sem acoplamento ao financeiro |

---

## ADR-007 — Structured Outputs Obrigatorio

**Arquivo:** [docs/adr/007-structured-outputs-required.md](../../docs/adr/007-structured-outputs-required.md)

### Impacto

- A IA deve retornar `items[]`, nunca um unico item solto
- O contrato estruturado precisa carregar `reasoning` por item e contexto consolidado
- Falhas de contrato devem ocorrer cedo no provider/schema

### Decisoes derivadas Epic 08

| Decisao | Detalhe |
|---|---|
| atualizar `ExtractionResultSchema` para `items[]` | multi-item obrigatorio |
| `itemType` por item | mistura de despesa/receita na mesma mensagem |
| reasoning por item | suporte a auditoria humana |
| `UNKNOWN` nao gera candidato | evita falso positivo financeiro |
| categorias sugeridas devem reconciliar com categorias existentes | reduz ruído na aprovacao |

---

## ADR-008 — OpenAI Vision Default Multimodal Provider

**Arquivo:** [docs/adr/008-openai-vision-default-multimodal-provider.md](../../docs/adr/008-openai-vision-default-multimodal-provider.md)

### Impacto

- `IMAGE` e `DOCUMENT` devem ser convertidos para extracao em `items[]`
- `AUDIO` deve alinhar-se ao mesmo contrato estruturado apos speech-to-text
- A approval queue precisa exibir arquivo original quando houver `storagePath`

### Decisoes derivadas Epic 08

| Decisao | Detalhe |
|---|---|
| um contrato unificado de itens para todas as modalidades | simplifica pipeline |
| preview/download na queue | apoio a aprovacao humana |
| fallback sem arquivo original | nao bloquear aprovacao |
| referencia de origem por item | prepara auditoria e pos-aprovacao |

---

## ADR-004 — Soft Delete

**Arquivo:** [docs/adr/004-soft-delete.md](../../docs/adr/004-soft-delete.md)

### Impacto

- A Epic 08 nao cria entidades financeiras finais, mas precisa planejar o pos-aprovacao com soft delete.
- Itens aprovados devem ser projetados para futura edicao e estorno, nunca exclusao fisica.
- A futura entidade `Adjustment` deve coexistir com soft delete no dominio financeiro.

### Decisoes derivadas Epic 08

| Decisao | Detalhe |
|---|---|
| nenhuma exclusao fisica na trilha de aprovacao | historico deve ser preservado |
| origem do item aprovado permanece rastreavel | mesmo apos materializacao futura |
| estorno futuro substitui delete | alinhamento com Epic 09+ |

---

## Matriz ADR x Artefato

| Artefato | ADR-001 | ADR-002 | ADR-003 | ADR-004 | ADR-006 | ADR-007 | ADR-008 |
|---|---|---|---|---|---|---|---|
| FinancialCandidate | dominio isolado | eventos | persistencia futura | prepara soft delete futuro | pipeline desacoplado | schema de origem | multimodal |
| CandidateItem | agregado filho | eventos por item | relacao 1:N | origem nao apagavel | reprocessamento | `items[]` obrigatorio | todas modalidades |
| ApprovalQueue | UI sem regra | eventos de decisao | consulta simples | sem delete fisico de historico | nao cria financeiro | depende da extraction valida | preview de arquivo |
| ApprovalDecision | trilha imutavel | CandidateApproved/Rejected | datas/ids neutros | historico persistente | handoff Epic 09 | reasoning auditavel | multimodal contextual |
