# API Documentation

**Base URL:** `http://localhost:4000`

## Route Handlers (Next.js App Router)

| Método | Rota | Status | Descrição |
|--------|------|--------|-----------|
| GET | `/api/health` | Implementado | Health check infra |

## Endpoints planejados (specs futuras)

| Método | Rota | Epic |
|--------|------|------|
| GET | `/api/expenses` | 07 |
| POST | `/api/expenses` | 02 |
| GET | `/api/approvals` | 09 |
| POST | `/api/approvals/:id/approve` | 09 |
| POST | `/api/reports/excel` | 08 |
| POST | `/api/webhooks/whatsapp` | 04 |

Documentação OpenAPI será gerada após Epic 07.
