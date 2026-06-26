# ADR-009: Pivot de Produto — WhatsApp Assistant

**Status:** Aceito (planejamento)  
**Data:** 2025-06-25  
**Decisores:** Product + Engineering

## Contexto

O repositório foi iniciado como **Finance AI Dashboard** — captura de despesas via WhatsApp, OCR, fila de aprovação e Excel.

A direção estratégica mudou: o valor está em **memória conversacional de longo prazo**, não em finanças.

## Decisão

1. Renomear produto para **WhatsApp Assistant**
2. Deprecar todos os módulos financeiros (sem remoção imediata)
3. Nova Epic **Assistant-01** como fonte de verdade de implementação
4. Manter infra existente: monorepo, Baileys, Prisma, CI, harnesses
5. IA nesta fase: **somente Whisper** (transcrição); sem agente conversacional
6. Retenção: 60 dias mensagens; relatórios permanentes

## Consequências

### Positivas

- Escopo focado; menos acoplamento financeiro
- Reuso de Epic 04 (WhatsApp) e runtime RC-03
- Path claro para relatórios e IA futura

### Negativas

- Código financeiro permanece até Fase 3 (dívida temporária)
- Nome de pacotes `@finance-ai/*` desalinhado até Fase 4
- Duas visões de arquitetura coexistem durante transição

## Alternativas rejeitadas

| Alternativa | Motivo rejeição |
|-------------|-----------------|
| Novo repositório greenfield | Perde Baileys estável, harnesses, CI |
| Manter finanças + assistant | Viola foco "1 feature por vez" |
| Remoção imediata financeiro | Risco alto; sem rollback |

## Referências

- [docs/product/vision.md](../product/vision.md)
- [docs/refactor/migration-plan.md](../refactor/migration-plan.md)
- [specs/epic-assistant-01/README.md](../../specs/epic-assistant-01/README.md)
