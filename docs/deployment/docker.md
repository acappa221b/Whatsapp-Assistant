# Deployment

## Docker

```bash
cd docker
docker compose up --build
```

App disponível em `http://localhost:4000`.

## Variáveis de ambiente

Copie `.env.example` para `.env` na raiz e configure:

- `DATABASE_URL` — SQLite file path
- `OPENAI_API_KEY` — Epic 05+

## Build local

```bash
pnpm install
pnpm db:generate
pnpm build
pnpm --filter @finance-ai/dashboard start
```

> **Windows:** build local sem `output: standalone` (symlinks). Docker usa `DOCKER_BUILD=true` para standalone no Linux.

## Railway (futuro)

PostgreSQL + volume persistente; migrar conforme ADR-003.
