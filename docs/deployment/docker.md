# Deployment

## Docker

```bash
cd docker
docker compose up --build
```

App disponível em `http://localhost:4000`.

## Configuração (zero `.env`)

O app **não lê** arquivo `.env` do disco. Defaults vêm de `APP_DEFAULTS` e `buildDefaultEnv()`; secrets e paths do usuário ficam no SQLite (`AppSettings`, `AiProviderConfig`) após o primeiro boot.

Para Docker/CI, variáveis opcionais de build:

| Variável | Uso |
|----------|-----|
| `NODE_ENV` | `production` em container |
| `DATABASE_URL` | Override do path SQLite (ex.: volume montado) |
| `DOCKER_BUILD` | `true` — habilita `output: standalone` no Next.js |

Configure provedores de IA em **Dashboard → Configurações** após subir o container.

## Build local

```bash
pnpm install
pnpm db:migrate
pnpm db:generate
pnpm build
pnpm --filter @finance-ai/dashboard start
```

Ou use o launcher: `pnpm launch` / duplo-clique em `Start WhatsApp Assistant.bat`.

> **Windows:** build local sem `output: standalone` (symlinks). Docker usa `DOCKER_BUILD=true` para standalone no Linux.

## Railway (futuro)

PostgreSQL + volume persistente; migrar conforme ADR-003.
