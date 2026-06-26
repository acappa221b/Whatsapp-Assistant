# Matriz de Testes — Epic 08 Financial Candidates + Approval Queue

**Versao:** 1.0.0  
**Total de casos:** 109

Legenda: `SPEC` = especificado; implementacao pendente.

---

## FinancialCandidate

| ID | Descricao | Pre-condicoes | Entrada | Resultado esperado | Status |
|----|-----------|---------------|---------|-------------------|--------|
| FC-001 | Criar candidato EXPENSE valido | Extraction com items[] expense | extractionId, sourceMessageId | Candidate `PENDING`, itemCount correto, CandidateCreated | SPEC |
| FC-002 | Criar candidato REVENUE valido | Extraction com items[] revenue | extractionId, sourceMessageId | Candidate `PENDING`, tipo REVENUE | SPEC |
| FC-003 | Rejeitar criacao sem items | Extraction com `items=[]` | extractionId | ValidationError | SPEC |
| FC-004 | Rejeitar criacao de extraction UNKNOWN | Extraction `UNKNOWN` | extractionId | Nenhum candidato criado | SPEC |
| FC-005 | Rejeitar confidence agregada > 1 | Payload inconsistente | confidence=1.2 | ValidationError | SPEC |
| FC-006 | Rejeitar confidence agregada < 0 | Payload inconsistente | confidence=-0.1 | ValidationError | SPEC |
| FC-007 | Status inicial obrigatorio PENDING | Extraction valida | create | status `PENDING` | SPEC |
| FC-008 | Impedir duplicata por extractionId | Candidate ja existe | mesmo extractionId | ConflictError ou update controlado | SPEC |
| FC-009 | Permitir reasoning nulo | Extraction sem reasoning consolidado | reasoning=null | Candidate valido | SPEC |
| FC-010 | Recalcular status apos aprovacao parcial | Candidate com 2 itens | 1 item aprovado | status agregado parcial | SPEC |
| FC-011 | Recalcular status apos rejeicao parcial | Candidate com 2 itens | 1 item rejeitado | status agregado parcial | SPEC |
| FC-012 | Recalcular status APPROVED total | Todos os itens aprovados | recalc | status APPROVED, CandidateApproved | SPEC |
| FC-013 | Recalcular status REJECTED total | Todos os itens rejeitados | recalc | status REJECTED, CandidateRejected | SPEC |
| FC-014 | Recalcular status MIXED_RESOLUTION | parte aprovada, parte rejeitada | recalc | status MIXED_RESOLUTION | SPEC |
| FC-015 | Suportar candidateType MIXED | itens expense e revenue | create | candidateType=MIXED | SPEC |
| FC-016 | Atualizar candidato por reprocessamento | Candidate PENDING existente | nova extraction derivada | CandidateUpdated | SPEC |
| FC-017 | Listar por status | 3 pending, 1 approved | status=PENDING | 3 candidatos | SPEC |
| FC-018 | Listar por candidateType | mix expense/revenue/mixed | candidateType=EXPENSE | subset correto | SPEC |
| FC-019 | Buscar detalhado por id | Candidate existe | id | retorna candidate + items + decisions | SPEC |
| FC-020 | Preservar sourceMessageId imutavel | Candidate existente | update | sourceMessageId inalterado | SPEC |
| FC-021 | Preservar extractionId imutavel | Candidate existente | update | extractionId inalterado | SPEC |
| FC-022 | Candidato com itens pendentes continua na fila | mix estados | recalc | queue include | SPEC |

---

## CandidateItem

| ID | Descricao | Pre-condicoes | Entrada | Resultado esperado | Status |
|----|-----------|---------------|---------|-------------------|--------|
| CI-001 | Criar item EXPENSE valido | Candidate sendo criado | description, amount, confidence | item criado | SPEC |
| CI-001A | Criar item REVENUE valido | Candidate sendo criado | description, amount, confidence | item criado | SPEC |
| CI-002 | Rejeitar amount zero | Candidate valido | amount=0 | ValidationError | SPEC |
| CI-003 | Rejeitar amount negativo | Candidate valido | amount=-10 | ValidationError | SPEC |
| CI-004 | Rejeitar description vazia | Candidate valido | description="   " | ValidationError | SPEC |
| CI-005 | Permitir suggestedCategory nula | Candidate valido | suggestedCategory=null | item valido | SPEC |
| CI-005A | Aceitar suggestedCategory apenas se existir | Categoria conhecida | suggestedCategory existente | item valido | SPEC |
| CI-005B | Rejeitar suggestedCategory inexistente | Categoria ausente no banco | suggestedCategory fantasma | ValidationError ou null | SPEC |
| CI-006 | Permitir suggestedSupplier nulo | Candidate valido | suggestedSupplier=null | item valido | SPEC |
| CI-007 | Permitir expenseDate nula | Candidate valido | expenseDate=null | item valido | SPEC |
| CI-008 | Rejeitar confidence > 1 | Candidate valido | confidence=1.5 | ValidationError | SPEC |
| CI-009 | Rejeitar confidence < 0 | Candidate valido | confidence=-0.2 | ValidationError | SPEC |
| CI-010 | Preservar ordem de 3 itens | Extraction multi-item | [item1,item2,item3] | ordem mantida | SPEC |
| CI-011 | Permitir itens repetidos | Mensagem com valores iguais | 2 itens iguais | ambos persistidos | SPEC |
| CI-012 | Substituir lista apos reprocessamento | Candidate com 2 itens | nova lista com 3 itens | lista antiga substituida | SPEC |
| CI-013 | Listar itens por candidateId | Candidate com 4 itens | candidateId | 4 itens ordenados | SPEC |
| CI-014 | Rejeitar item sem candidateId | sem pai | candidateId vazio | ValidationError | SPEC |
| CI-015 | Suportar item vindo de IMAGE | Extraction image | item com supplier | item valido | SPEC |
| CI-016 | Suportar item vindo de DOCUMENT | Extraction document | item com date | item valido | SPEC |
| CI-017 | Suportar item vindo de AUDIO | Extraction audio | item com reasoning | item valido | SPEC |
| CI-018 | Preservar reasoning por item | IA retorna reasoning | reasoning string | item salva reasoning | SPEC |
| CI-019 | Aprovar item individual | Item PENDING | approve | status APPROVED | SPEC |
| CI-020 | Rejeitar item individual | Item PENDING | reject | status REJECTED | SPEC |
| CI-021 | Editar item antes da aprovacao | Item PENDING | patch campos | item atualizado + auditoria | SPEC |
| CI-022 | Bloquear edicao apos aprovacao | Item APPROVED | patch | Error de estado | SPEC |
| CI-023 | Bloquear edicao apos rejeicao | Item REJECTED | patch | Error de estado | SPEC |
| CI-024 | Preservar referencia a WhatsappMessage | Item aprovado | get detail | sourceMessageId presente | SPEC |
| CI-025 | Preservar referencia a Extraction | Item aprovado | get detail | extractionId presente | SPEC |
| CI-026 | Preservar referencia a arquivo | Item multimodal aprovado | get detail | sourceFile presente | SPEC |
| CI-027 | Aprovar item de candidato MIXED | Candidate misto | approve item revenue | estado individual correto | SPEC |
| CI-028 | Rejeitar item de candidato MIXED | Candidate misto | reject item expense | estado individual correto | SPEC |

---

## ApprovalQueue / ApprovalDecision

| ID | Descricao | Pre-condicoes | Entrada | Resultado esperado | Status |
|----|-----------|---------------|---------|-------------------|--------|
| AQ-001 | Listar apenas pendentes | 3 pending, 2 decididos | GET queue | 3 itens | SPEC |
| AQ-002 | Ordenar por createdAt desc | varios candidatos | GET queue | mais recentes primeiro | SPEC |
| AQ-003 | Mostrar mensagem original | Candidate ligado a WhatsappMessage | queue item | messageContent presente | SPEC |
| AQ-004 | Mostrar arquivo original image | storagePath existente | queue item | preview/download disponivel | SPEC |
| AQ-005 | Mostrar arquivo original document | storagePath existente | queue item | preview/download disponivel | SPEC |
| AQ-006 | Mostrar arquivo original audio | storagePath existente | queue item | link/download disponivel | SPEC |
| AQ-007 | Aprovar item com comentario vazio | Candidate PENDING | approve comment=null | decisao valida | SPEC |
| AQ-008 | Aprovar item com comentario preenchido | Candidate PENDING | approve comment="ok" | comment persistido | SPEC |
| AQ-009 | Rejeitar item com comentario vazio | Candidate PENDING | reject comment=null | decisao valida | SPEC |
| AQ-010 | Rejeitar item com comentario preenchido | Candidate PENDING | reject comment="duplicado" | comment persistido | SPEC |
| AQ-011 | Double submit approve | Candidate PENDING | dois PATCH seguidos | uma decisao efetiva | SPEC |
| AQ-012 | Double submit reject | Candidate PENDING | dois PATCH seguidos | uma decisao efetiva | SPEC |
| AQ-013 | Bloquear decisao sem userId | Candidate PENDING | userId vazio | ValidationError | SPEC |
| AQ-014 | Historico de decisoes por candidato | Candidate decidido | candidateId | 1+ ApprovalDecision | SPEC |
| AQ-015 | Queue vazia | nenhum pending | GET queue | empty state amigavel | SPEC |
| AQ-016 | Filtro por candidateType | mix tipos | type=EXPENSE | subset correto | SPEC |
| AQ-017 | Approve All | 3 itens pendentes | bulk approve | 3 itens aprovados | SPEC |
| AQ-018 | Reject All | 3 itens pendentes | bulk reject | 3 itens rejeitados | SPEC |
| AQ-019 | Approve Selected | 4 itens, 2 selecionados | bulk approve selected | apenas 2 aprovados | SPEC |
| AQ-020 | Reject Selected | 4 itens, 2 selecionados | bulk reject selected | apenas 2 rejeitados | SPEC |
| AQ-021 | Bloquear bulk sem selecao | itens pendentes | selection=[] | ValidationError | SPEC |
| AQ-022 | Auditar edicao antes de aprovar | item alterado | edit + approve | ApprovalDecision + diff persistidos | SPEC |

---

## IA / Extraction Contract

| ID | Descricao | Pre-condicoes | Entrada | Resultado esperado | Status |
|----|-----------|---------------|---------|-------------------|--------|
| AI-001 | TEXT retorna `items[]` | mensagem simples | text payload | array com >=1 item | SPEC |
| AI-002 | IMAGE retorna `items[]` | imagem valida | vision payload | array com >=1 item | SPEC |
| AI-003 | DOCUMENT retorna `items[]` | documento valido | pdf/text payload | array com >=1 item | SPEC |
| AI-004 | AUDIO retorna `items[]` | audio transcrito | audio payload | array com >=1 item | SPEC |
| AI-005 | Multi-item texto 2 linhas | "16 bala, 20 cheirinho" | text payload | 2 items | SPEC |
| AI-006 | Multi-item documento 3 linhas | nota com 3 gastos | document payload | 3 items | SPEC |
| AI-007 | Item sem categoria conhecida | payload ambiguo | category ausente | category=null permitido | SPEC |
| AI-008 | UNKNOWN sem itens financeiros | conteudo nao financeiro | payload | nao cria FinancialCandidate | SPEC |
| AI-009 | Itens mistos na mesma mensagem | texto com entrada e saida | payload | items EXPENSE + REVENUE | SPEC |
| AI-010 | category deve reconciliar com existentes | IA sugere categoria | payload | sugestao validada contra banco | SPEC |

---

## API / UI / Workflow

| ID | Descricao | Pre-condicoes | Entrada | Resultado esperado | Status |
|----|-----------|---------------|---------|-------------------|--------|
| WF-001 | GET `/api/approvals` lista queue | candidatos pending | request | itens com origem e items[] | SPEC |
| WF-002 | PATCH approve item atualiza status | item pending | approve payload | item APPROVED + event + decision | SPEC |
| WF-003 | PATCH reject item atualiza status | item pending | reject payload | item REJECTED + event + decision | SPEC |
| WF-004 | `/dashboard/approvals` mostra itens detectados | queue item com 2 items | render | 2 linhas/itens exibidos | SPEC |
| WF-005 | `/dashboard/approvals` mostra confianca consolidada | candidate com confidence | render | valor exibido | SPEC |
| WF-006 | `/dashboard/approvals` exibe tipo/origem/arquivo | candidate multimodal | render | todos campos presentes | SPEC |
| WF-007 | CandidateCreated entra na queue | extraction processada | domain event | tela passa a listar candidato | SPEC |
| WF-008 | CandidateApproved remove da queue pendente | candidate approved | domain event | item some da lista padrao | SPEC |
| WF-009 | CandidateRejected remove da queue pendente | candidate rejected | domain event | item some da lista padrao | SPEC |
| WF-010 | Compatibilidade com Epic 09 | candidate approved | handoff | pronto para futura criacao de Expense/Revenue | SPEC |
| WF-011 | Sem criar lancamento financeiro na Epic 08 | approve executado | candidate approved | nenhum Expense/Revenue criado | SPEC |
| WF-012 | Reprocessamento atualiza queue | candidate pending + nova extraction | CandidateUpdated | UI reflete novos itens | SPEC |
| WF-013 | Fallback sem arquivo original | candidate TEXT | render | tela continua funcional | SPEC |
| WF-014 | Payload de auditoria com comentario opcional | approve/reject | comment null/string | auditoria coerente | SPEC |
| WF-015 | Governa chat habilitado + extraction valida | mensagem do grupo permitido | pipeline completo | candidate criado e enviado para queue | SPEC |
| WF-016 | Chat desabilitado nao cria candidate | IA desligada no chat | mensagem recebida | sem candidate/queue | SPEC |
| WF-017 | UI permite editar item antes da aprovacao | item pendente | abrir edicao | campos editaveis | SPEC |
| WF-018 | UI oferece Approve All | 3 itens pendentes | click | lote aprovado | SPEC |
| WF-019 | UI oferece Reject All | 3 itens pendentes | click | lote rejeitado | SPEC |
| WF-020 | UI oferece Approve Selected | 4 itens | select 2 | apenas 2 aprovados | SPEC |
| WF-021 | UI oferece Reject Selected | 4 itens | select 2 | apenas 2 rejeitados | SPEC |
| WF-022 | UI mostra tipo individual do item | candidate mixed | render | itemType por linha | SPEC |
| WF-023 | UI mostra categorias apenas existentes | edicao de item | dropdown | apenas categorias do banco | SPEC |
| WF-024 | Pos-aprovacao preserva origem para Epic 09 | item aprovado | handoff | refs completas mantidas | SPEC |
| WF-025 | Preparacao para Adjustment | item aprovado | metadata/read model | referencia futura prevista | SPEC |
| WF-026 | Excel continua derivado | item aprovado | export futuro | nao altera fonte de verdade | SPEC |

---

## Resumo

| Area | Casos |
|------|-------|
| FinancialCandidate | 22 |
| CandidateItem | 29 |
| ApprovalQueue / ApprovalDecision | 22 |
| IA / Extraction Contract | 10 |
| API / UI / Workflow | 26 |
| **Total** | **109** |
