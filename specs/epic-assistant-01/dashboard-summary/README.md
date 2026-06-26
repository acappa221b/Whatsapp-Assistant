# Dashboard Sumário — Spec

**Epic:** Assistant-01  
**Status:** SPEC ONLY

## Objetivo

Página inicial `/dashboard` renomeada para **Sumário** com 6 widgets.

## Widgets

| # | Widget | Tipo | Período |
|---|--------|------|---------|
| 1 | Mensagens por dia | Gráfico linha/barra | 30 dias |
| 2 | Fotos por dia | Gráfico linha/barra | 30 dias |
| 3 | Top 10 usuários | Tabela (nome, id, count) | All time |
| 4 | Total mensagens | KPI número | All time |
| 5 | Total usuários | KPI número | All time |
| 6 | Total grupos | KPI número | All time |

## API (proposta)

```
GET /api/summary/messages-by-day?days=30
GET /api/summary/photos-by-day?days=30
GET /api/summary/top-users?limit=10
GET /api/summary/totals
```

## Regras

- "Fotos" = messageType IMAGE
- Top users = group by sender/participantId
- Grupos = chatId ends with `@g.us`

## Critérios de Aceite

**Given** mensagens nos últimos 30 dias  
**When** usuário abre Sumário  
**Then** gráfico mensagens/dia reflete counts corretos

**Given** 0 mensagens  
**When** usuário abre Sumário  
**Then** widgets exibem zero sem erro

## Estratégia de Testes

- Unit: aggregation queries
- E2E: widgets renderizam
- Harness: `DashboardSummarySpecHarness`
