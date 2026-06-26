# Prompt — Rearquitetura WhatsApp Assistant

**Data:** 2025-06-25  
**Tipo:** Planejamento (sem implementação)  
**Autor:** Product request via Cursor

## Propósito

Redefinir produto de Finance AI Dashboard para **WhatsApp Assistant** — memória conversacional de longo prazo.

## Entregáveis gerados

| # | Artefato | Path |
|---|----------|------|
| 1 | Visão do produto | `docs/product/vision.md` |
| 2 | Plano de migração | `docs/refactor/migration-plan.md` |
| 3 | Módulos deprecated | `docs/refactor/deprecated-modules.md` |
| 4 | Arquitetura | `docs/architecture/assistant-overview.md` |
| 5 | Roadmap | `ROADMAP.md` |
| 6 | Epic Assistant-01 | `specs/epic-assistant-01/` |
| 7 | Harnesses spec | `harness/epic-assistant-01/` |
| 8 | ADR pivot | `docs/adr/009-product-pivot-whatsapp-assistant.md` |
| 9 | Whisper docs | `docs/whisper/transcription.md` |
| 10 | Spec Relatórios | `specs/epic-assistant-01/reports-module-spec.md` |
| 11 | README atualizado | `README.md` |

## Decisões

- Nenhuma implementação de código nesta fase
- Módulos financeiros deprecated, não removidos
- Relatórios: spec only
- IA conversacional: fora de escopo
- Whisper: spec completa, impl na Fase 1
- Retenção: 60d mensagens, relatórios permanentes

## Próximo passo

Aprovação formal → iniciar Fase 1 item 1.1 (renaming + redirect + menu)
