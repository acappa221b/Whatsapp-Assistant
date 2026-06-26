# ADR-004: Soft Delete para Expense e Revenue

**Status:** Aceito  
**Data:** 2025-06-22  
**Versão:** 0.0.2

## Contexto

Registros financeiros (despesas e receitas) exigem rastreabilidade completa para auditoria, recuperação de dados e conformidade. Exclusão física (`DELETE`) elimina histórico e compromete integrações futuras com IA e relatórios.

## Decisão

**Expense** e **Revenue** nunca serão removidos fisicamente do banco de dados.

### Campo obrigatório

```typescript
deletedAt: Date | null  // null = ativo, Date = soft deleted
```

### Regra

| Operação | Permitido |
|----------|-----------|
| `UPDATE` setando `deletedAt = now()` | Sim (soft delete) |
| `DELETE` SQL / Prisma `.delete()` | **Nunca** |
| Queries de listagem/KPI | Filtrar `deletedAt IS NULL` por padrão |
| Queries de auditoria/admin | Podem incluir registros deletados |

### Implementação

- Epic 02: entidades de domínio com `SoftDeletable` (tipo em `@finance-ai/shared`)
- Epic 03: campo `deletedAt` no schema Prisma + migrations
- Epic 10: AuditLog registra soft delete como ação `SOFT_DELETE`

## Justificativa

1. **Auditoria** — trilha completa de lançamentos financeiros
2. **Recuperação** — restauração via `deletedAt = null`
3. **Conformidade financeira** — dados nunca desaparecem silenciosamente
4. **Integração IA** — histórico disponível para retreinamento e análise

## Alternativas consideradas

| Alternativa | Motivo rejeição |
|-------------|-----------------|
| DELETE físico | Perda irreversível de dados |
| Flag `isDeleted: boolean` | Menos informação (sem timestamp de exclusão) |
| Arquivo em tabela separada | Complexidade e joins desnecessários no MVP |

## Consequências

- Repositórios devem expor `softDelete(id)` em vez de `delete(id)`
- Harness e lint rules futuras podem banir `.delete()` em Expense/Revenue
- Export Excel deve respeitar filtro `deletedAt IS NULL` por padrão

## Referências

- `packages/shared/src/types/index.ts` — tipo `SoftDeletable`
- Epic 02 spec (pendente)
- Epic 03 migrations (pendente)
