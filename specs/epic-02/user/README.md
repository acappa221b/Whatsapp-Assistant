# User — Especificação de Domínio

**Epic:** 02  
**Entidade:** User (Usuário)  
**Versão:** 1.0.0

---

## Objetivo

Representar usuários do dashboard administrativo com papéis (roles) que definem permissões de leitura e mutação.

---

## Definição

Um **User** é uma conta de acesso ao sistema. Autenticação completa é fora do escopo da Epic 02 — esta spec define entidade, roles e matriz de permissões para uso futuro em API e dashboard.

---

## Campos

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `id` | `string` (cuid) | Sim | Gerado; imutável |
| `name` | `string` | Sim | Min 2 chars, max 150 |
| `email` | `string` | Sim | Formato email válido; único |
| `role` | `UserRole` | Sim | Enum |
| `createdAt` | `Date` | Sim | Auto |
| `updatedAt` | `Date` | Sim | Auto |

---

## Enum `UserRole`

| Role | Descrição |
|------|-----------|
| `ADMIN` | Acesso total; gerencia usuários |
| `MANAGER` | CRUD financeiro + aprovações |
| `VIEWER` | Somente leitura |

---

## Regras de Negócio

1. **Email único** (case-insensitive)
2. **Email normalizado** para lowercase antes de persistir
3. **Role obrigatório** com default `VIEWER` na criação se omitido
4. **Sem soft delete no MVP** — desativação de conta é Epic futura
5. **Último ADMIN:** não permitir rebaixar/remover último ADMIN (Epic futura com auth)

---

## Permissões por Role

| Ação | ADMIN | MANAGER | VIEWER |
|------|-------|---------|--------|
| Listar expenses/revenues | ✅ | ✅ | ✅ |
| Criar expense/revenue | ✅ | ✅ | ❌ |
| Atualizar expense/revenue | ✅ | ✅ | ❌ |
| Soft delete expense/revenue | ✅ | ✅ | ❌ |
| Aprovar fila (Epic 09) | ✅ | ✅ | ❌ |
| Gerenciar categories | ✅ | ✅ | ❌ |
| Gerenciar suppliers | ✅ | ✅ | ❌ |
| Gerenciar users | ✅ | ❌ | ❌ |
| Ver audit log completo | ✅ | ✅ | ❌ |
| Export Excel | ✅ | ✅ | ✅ |

---

## Invariantes

| ID | Invariante |
|----|------------|
| INV-U01 | `email` único |
| INV-U02 | `role` ∈ { ADMIN, MANAGER, VIEWER } |
| INV-U03 | `email` formato RFC 5322 simplificado |

---

## Casos de Uso

| Caso de uso | Descrição |
|-------------|-----------|
| `CreateUser` | Cria usuário |
| `UpdateUser` | Atualiza name, email, role |
| `GetUserById` | Busca por ID |
| `ListUsers` | Lista usuários (ADMIN only) |

---

## Eventos Emitidos

| Evento | Quando | Payload |
|--------|--------|---------|
| `UserCreated` | Após create | `{ userId, email, role }` |
| `UserUpdated` | Após update | `{ userId, changes }` |

---

## Dependências

Nenhuma. Referenciado indiretamente por AuditLog (Epic 10) como `actorId`.

---

## Critérios de Aceite

### CA-U01 — Criar usuário viewer

- **Given** email único válido
- **When** `CreateUser` com role VIEWER
- **Then** user criado; evento `UserCreated`

### CA-U02 — Rejeitar email duplicado

- **Given** user com email existente
- **When** `CreateUser` mesmo email
- **Then** erro unicidade

### CA-U03 — Normalizar email

- **Given** email "User@Example.COM"
- **When** `CreateUser`
- **Then** persistido como "user@example.com"

### CA-U04 — Permissão viewer

- **Given** user VIEWER
- **When** tentativa `CreateExpense`
- **Then** negado (camada application — Epic 07)

---

## Casos de Borda

| Cenário | Comportamento |
|---------|---------------|
| Email inválido "not-an-email" | Rejeitar |
| Role inválido | Rejeitar |
| Name 1 char | Rejeitar |
| Update email para existente | Rejeitar |

---

## Estratégia de Testes

Matriz: IDs `USR-*` em [test-matrix.md](../test-matrix.md).
