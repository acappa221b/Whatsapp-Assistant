# Database Schema

**ORM:** Prisma  
**MVP:** SQLite (`file:./dev.db`)  
**Futuro:** PostgreSQL (ver [ADR-003](../adr/003-sqlite-postgresql.md))

## Schema location

`packages/database/prisma/schema.prisma`

## Enums

| Enum | Valores |
|------|---------|
| ExpenseSource | MANUAL, WHATSAPP_TEXT, WHATSAPP_IMAGE, OCR, IMPORT |
| CategoryType | EXPENSE, REVENUE |
| UserRole | ADMIN, MANAGER, VIEWER |

## Modelos financeiros (Epic 03)

### Expense

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String | cuid |
| description | String | Descrição do gasto |
| amount | Float | Valor |
| categoryId | String | FK Category (obrigatório) |
| supplierId | String? | FK Supplier |
| date | DateTime | Data do lançamento |
| source | ExpenseSource | Origem |
| confidence | Float | 0–1, IA |
| deletedAt | DateTime? | Soft delete (ADR-004) |

**Índices:** categoryId, supplierId, date, deletedAt

### Revenue

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String | cuid |
| description | String | Descrição |
| amount | Float | Valor |
| date | DateTime | Data |
| source | ExpenseSource | Origem |
| deletedAt | DateTime? | Soft delete |

**Índices:** date, deletedAt

### Category

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String | cuid |
| name | String | Nome normalizado |
| type | CategoryType | EXPENSE ou REVENUE |

**Constraint:** UNIQUE(name, type)

### Supplier

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String | cuid |
| name | String | Nome (único) |
| document | String? | CPF/CNPJ |
| deletedAt | DateTime? | Soft delete |

**Constraint:** UNIQUE(name)

### User

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String | cuid |
| name | String | Nome |
| email | String | Email (único) |
| role | UserRole | ADMIN, MANAGER, VIEWER |

## WhatsappMessage (Epic 04)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String | cuid |
| externalMessageId | String | ID da mensagem no WhatsApp (único) |
| chatId | String | JID do chat |
| sender | String | Remetente |
| content | String | Texto ou caption |
| messageType | MessageType | TEXT, IMAGE, DOCUMENT, AUDIO, UNKNOWN |
| mediaUrl | String? | URL da mídia (futuro) |
| processed | Boolean | Flag de processamento (Epic 05+) |
| receivedAt | DateTime | Quando a mensagem foi recebida |
| createdAt | DateTime | Quando persistiu no banco |

## Extraction (Epic 06)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String | cuid |
| messageId | String | FK para `WhatsappMessage.id` |
| type | ExtractionType | EXPENSE_CANDIDATE, REVENUE_CANDIDATE, UNKNOWN |
| confidence | Float | Score entre 0 e 1 |
| data | Json | Candidato estruturado completo |
| model | String | Modelo de IA utilizado |
| createdAt | DateTime | Quando a extração foi persistida |

## Modelos auxiliares (Epics futuras)

- **Attachment** — vinculada a Expense
- **ApprovalQueue** — fila de aprovação
- **AuditLog** — trilha de auditoria

## Migrations

Pasta: `packages/database/prisma/migrations/`

Migration inicial: `0001_initial_financial_domain`

## Seed

Categorias padrão EXPENSE: Alimentação, Combustível, Marketing, Ferramentas, Impostos, Transporte, Outros.

```bash
pnpm --filter @finance-ai/database db:seed
```

## Comandos

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm --filter @finance-ai/database db:seed
```

## Repositórios

Ver [repositories.md](./repositories.md)
