# Testing Strategy

**Cobertura mínima obrigatória:** 90%

## Ferramentas

| Tipo | Ferramenta | Local |
|------|------------|-------|
| Unitário | Vitest | `packages/**`, `vitest.config.ts` |
| Integração | Vitest | `packages/database`, domínios |
| E2E | Playwright | `apps/dashboard/e2e` |
| Componente | Testing Library | `@finance-ai/tests` |

## Comandos

```bash
pnpm test:unit        # testes rápidos (sem gate de coverage)
pnpm test:coverage    # testes + gate 90% (CI)
pnpm test:e2e
```

## Coverage Policy

Configuração centralizada em `config/coverage.ts`.

### Thresholds obrigatórios

| Métrica | Mínimo |
|---------|--------|
| Branches | 90% |
| Functions | 90% |
| Lines | 90% |
| Statements | 90% |

### Escopo (Epic 01)

Apenas código de infraestrutura implementado entra no gate:

- `packages/core/src/events/**`
- `packages/shared/src/**`

O escopo **expande por epic** conforme módulos são implementados. Stubs e código não implementado ficam fora do gate até sua epic correspondente.

### Exclusões

- `**/*.test.ts`
- `**/tests/**`
- `packages/*/src/index.ts` (barrel exports de pacote)
- `**/*.d.ts`

### CI

O pipeline executa `pnpm test:coverage`. Falha abaixo de 90% em qualquer métrica bloqueia merge.

### Relatórios

Gerados em `./coverage/` (html, json, json-summary).

## Fluxo SDD

1. Requisito → Spec (casos de teste documentados)
2. Testes escritos ou esqueletos antes da implementação
3. Implementação
4. Harness + CI

## Testes existentes (Epic 01)

- `packages/core/src/events/event-bus.test.ts`
- `packages/shared/src/utils/utils.test.ts`
- `packages/shared/src/errors/errors.test.ts`
- `apps/dashboard/e2e/dashboard.spec.ts`
