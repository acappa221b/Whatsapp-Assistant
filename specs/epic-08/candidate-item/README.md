# Candidate Item — Especificacao de Dominio

**Epic:** 08  
**Entidade:** CandidateItem  
**Versao:** 1.0.0

## Objetivo

Representar cada linha/item financeiro detectado pela IA dentro de um `FinancialCandidate`, permitindo suporte real a mensagens multi-item.

## Definicao

`CandidateItem` e a unidade granular da interpretacao financeira. Um unico candidato pode conter varios itens derivados da mesma mensagem ou do mesmo arquivo, incluindo despesas e receitas simultaneamente.

Modalidades obrigatorias cobertas por esta spec: `TEXT`, `IMAGE`, `DOCUMENT`, `AUDIO`.

## Campos

| Campo | Tipo | Obrigatorio | Regras |
|---|---|---|---|
| `id` | `string` | Sim | ID gerado |
| `candidateId` | `string` | Sim | FK logica para `FinancialCandidate.id` |
| `itemType` | `EXPENSE \| REVENUE` | Sim | Tipo individual do item |
| `description` | `string` | Sim | Min 1 char |
| `amount` | `number` | Sim | `> 0` |
| `suggestedCategory` | `string \| null` | Nao | Sugestao da IA |
| `suggestedSupplier` | `string \| null` | Nao | Sugestao da IA |
| `expenseDate` | `string \| null` | Nao | Data inferida/original do item |
| `confidence` | `number` | Sim | 0..1 |
| `reasoning` | `string \| null` | Nao | Justificativa do item |
| `status` | `PENDING \| APPROVED \| REJECTED` | Sim | Estado individual de aprovacao |
| `sourceMessageId` | `string` | Sim | Referencia direta a `WhatsappMessage` |
| `extractionId` | `string` | Sim | Referencia direta a `Extraction` |
| `sourceFile` | `string \| null` | Nao | Arquivo original quando houver `storagePath` |

## Regras de Negocio

1. Cada item pertence a exatamente um `FinancialCandidate`.
2. `amount` deve ser maior que zero para `EXPENSE` e `REVENUE`.
3. `description` e obrigatoria, inclusive para OCR/ASR.
4. `confidence` deve refletir a confianca do item, nao apenas do candidato pai.
5. `suggestedCategory` deve apontar apenas para categorias existentes ou ser `null`.
6. `suggestedSupplier` e apenas sugestao; nao resolve FK nesta epic.
7. `status` inicial do item e `PENDING`.
8. O item pode ser editado completamente antes da aprovacao.
9. Toda edicao previa a aprovacao deve gerar trilha de auditoria.
10. O item aprovado deve manter referencia para `WhatsappMessage`, `Extraction` e arquivo original.
11. O desenho deve permitir futura materializacao, edicao e estorno do lancamento sem exclusao fisica.
12. `expenseDate` pode ser nula quando a IA nao identificar data.
13. Ordem dos itens deve ser preservada conforme extraida do conteudo original.

## Invariantes

| ID | Invariante |
|---|---|
| INV-CI-01 | `amount > 0` |
| INV-CI-02 | `description.trim().length > 0` |
| INV-CI-03 | `confidence >= 0 && confidence <= 1` |
| INV-CI-04 | `candidateId` e obrigatorio |
| INV-CI-05 | item nao existe fora do contexto de um candidato |
| INV-CI-06 | `itemType` pertence a `EXPENSE` ou `REVENUE` |
| INV-CI-07 | referencias de origem nao podem ser perdidas apos aprovacao |

## Casos de Uso

| Caso de uso | Descricao |
|---|---|
| `CreateCandidateItems` | Materializa itens vindos da extraction |
| `ListCandidateItemsByCandidate` | Retorna itens ordenados de um candidato |
| `ReplaceCandidateItems` | Substitui itens apos reprocessamento controlado |
| `EditCandidateItemBeforeApproval` | Permite edicao completa antes da aprovacao |
| `ApproveCandidateItem` | Aprova item individual |
| `RejectCandidateItem` | Rejeita item individual |

## Eventos Emitidos

| Evento | Quando | Payload minimo |
|---|---|---|
| `CandidateCreated` | Item criado junto com candidato pai | `{ candidateId, itemCount }` |
| `CandidateUpdated` | Lista de itens substituida | `{ candidateId, itemCount, changes }` |
| `CandidateItemEdited` | Item editado antes da aprovacao | `{ candidateId, itemId, userId, changes, comment }` |
| `CandidateItemApproved` | Item aprovado | `{ candidateId, itemId, userId, timestamp, comment }` |
| `CandidateItemRejected` | Item rejeitado | `{ candidateId, itemId, userId, timestamp, comment }` |

## Dependencias

- `FinancialCandidate`
- `Extraction.items[]`
- `OpenAIExtractionProvider`
- `Category` existente
- `WhatsappMessage`
- `Extraction`

## Criterios de Aceite

### CA-CI-01 — criar 3 itens de texto
- **Given** a mensagem `"16 reais bala, 20 reais cheirinho, 120 gasolina"`
- **When** a extraction retorna 3 itens
- **Then** 3 `CandidateItem`s sao criados e mantem a ordem original

### CA-CI-02 — preservar item sem categoria
- **Given** um item com categoria desconhecida
- **When** o item e criado
- **Then** `suggestedCategory = null` e a criacao continua valida

### CA-CI-03 — rejeitar valor zero
- **Given** um item com `amount = 0`
- **When** `CreateCandidateItems` e executado
- **Then** a validacao falha

### CA-CI-04 — substituir itens em reprocessamento
- **Given** um candidato existente com 2 itens
- **When** `ReplaceCandidateItems` recebe nova lista com 3 itens
- **Then** os 2 itens antigos sao substituidos logicamente pelos 3 novos

### CA-CI-05 — aprovar item individual
- **Given** um item `PENDING`
- **When** `ApproveCandidateItem` e executado
- **Then** o item muda para `APPROVED` e preserva todas as referencias de origem

### CA-CI-06 — editar item antes de aprovar
- **Given** um item `PENDING`
- **When** o usuario altera descricao, valor e categoria sugerida
- **Then** as mudancas ficam auditadas e o item continua `PENDING`

### CA-CI-07 — restringir categoria a existentes
- **Given** uma sugestao de categoria inexistente
- **When** o item e validado
- **Then** a categoria deve ser rejeitada ou normalizada para `null`

## Casos de Borda

| Cenario | Esperado |
|---|---|
| item repetido com mesmo texto e valor | permitido |
| item sem supplier | `suggestedSupplier = null` |
| data parcial `2026-06` | manter como string original ou normalizar em spec futura |
| audio com separadores ambiguos | depender do payload final da IA |
| documento com totais e subtotais | a IA deve retornar apenas os itens financeiros interpretados |
| item aprovado depois editado | fora de escopo desta epic; preparar para pos-aprovacao |

## Estrategia de Testes

- Testes unitarios de validacao de campos
- Testes multi-item por modalidade
- Testes de preservacao de ordem
- Testes de substituicao apos reprocessamento
- Testes negativos para amount/description/confidence
- Testes de aprovacao individual, edicao e trilha de auditoria
