# ADR-003: SQLite MVP + PostgreSQL Future

**Status:** Aceito  
**Data:** 2025-06-22  
**Versão:** 0.0.1

## Contexto

O projeto precisa de persistência desde o MVP local, com caminho claro para produção.

## Decisão

1. **MVP:** SQLite via Prisma (`provider = "sqlite"`)
2. **Produção futura:** PostgreSQL (mesmo schema Prisma, troca de provider)
3. **ORM único:** Prisma em `@finance-ai/database`
4. **Migrations versionadas** a partir da Epic 03

### Configuração MVP

```env
DATABASE_URL="file:./dev.db"
```

### Migração futura

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Ajustes esperados: tipos JSON nativos, índices e constraints específicos.

## Alternativas consideradas

| Alternativa | Motivo rejeição |
|-------------|-----------------|
| PostgreSQL desde dia 1 | Fricção setup local/Docker MVP |
| Drizzle ORM | Stack obrigatória define Prisma |
| Arquivos JSON | Sem integridade relacional |

## Consequências

- Desenvolvimento local zero-config
- Docker volume para SQLite em container
- Testes de integração usam DB file temporário
- Epic 03 documentará procedure de cutover PostgreSQL

## Referências

- `packages/database/prisma/schema.prisma`
- `docs/database/schema.md`
