# CI/CD

**Pipeline:** GitHub Actions  
**Workflow:** `.github/workflows/ci.yml`

## Fluxo obrigatório

```
Install
  ↓
Lint
  ↓
Type Check
  ↓
Unit Tests (+ Coverage Gate 90%)
  ↓
Harness
  ↓
Build
```

Qualquer falha interrompe o pipeline.

## Triggers

- Push para `main`, `master`, `develop`
- Pull requests para essas branches

## Cache

- **pnpm store:** via `actions/setup-node` com `cache: pnpm`
- **Turbo:** cache remoto pode ser adicionado futuramente

## Comandos locais (espelham CI)

```bash
pnpm install
cp packages/database/.env.example packages/database/.env
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm harness
pnpm build
```

## Variáveis de ambiente (CI)

| Variável | Valor CI |
|----------|----------|
| `DATABASE_URL` | `file:./dev.db` (via `.env.example`) |
| `DOCKER_BUILD` | `false` (build local Next.js) |

## Secrets (futuro)

- `OPENAI_API_KEY` — Epic 05+
- `DATABASE_URL` PostgreSQL — MVP v1.0

## E2E

Playwright (`pnpm test:e2e`) não está no pipeline principal da Epic 01. Será adicionado na Epic 07 com ambiente de preview.

## Commit policy

Commits devem seguir [Conventional Commits](../development/contributing.md). Husky valida via `commit-msg` hook.
