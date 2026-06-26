# Prompt Log — Epic 02 Specification

**Timestamp:** 2025-06-22  
**Purpose:** Especificação formal do domínio financeiro (sem implementação)

## Artefatos

- 5 entity READMEs (expense, revenue, category, supplier, user)
- test-matrix.md (55 casos)
- events-catalog.md (13 eventos)
- adr-impact.md
- expense/sequence-diagrams.md (4 diagramas Mermaid)
- 5 DomainSpec harnesses

## Decisões

- Soft delete: Expense, Revenue, Supplier (ADR-004)
- Supplier CPF/CNPJ documentado, não implementado
- User permissions matrix para Epic 07
- Coverage de spec via harnesses, não código
