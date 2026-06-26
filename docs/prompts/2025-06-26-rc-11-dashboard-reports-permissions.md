# Prompt log — RC-11 dashboard, reports, permissions

**Data:** 2025-06-26  
**Versão:** 1.2.0-rc11  
**Propósito:** Dashboard real, token ledger, relatórios diários, permissões v2, fix saudações, header status

## Decisões

- Timezone relatórios: transcript formatado em America/Sao_Paulo; `reportDate` UTC date-only
- Custo BRL via config estática documentada em ADR-011
- `aiProcessingEnabled` mantido no DB (deprecated) mas sempre false no domínio/UI
- Job diário via `setInterval` 60s checando 23:55

## Arquivos principais gerados/alterados

- `packages/core/src/domains/dashboard-analytics/`
- `packages/core/src/domains/api-token-usage/`
- `packages/core/src/domains/daily-report/`
- `apps/dashboard/src/app/api/dashboard/metrics/route.ts`
- `apps/dashboard/src/components/dashboard/`
- `harness/rc-11/`
