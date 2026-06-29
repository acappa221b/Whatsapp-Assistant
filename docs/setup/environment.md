# Environment Configuration — Zero `.env` Architecture

**RC-14:** o aplicativo não lê arquivo `.env` do disco. Configuração de usuário vive no SQLite (`AppSettings`, `AiProviderConfig`).

## Camadas de configuração

| Camada | Fonte | Conteúdo |
|--------|-------|----------|
| Defaults | `APP_DEFAULTS` (`app.defaults.ts`) | Porta, paths, flags WhatsApp |
| Usuário | `AppSettings` (Prisma) | Nome, timezone, porta, wizard |
| Secrets | `AiProviderConfig` (criptografado) | API keys de IA |
| CI/Test | `process.env` mínimo | `NODE_ENV`, `DATABASE_URL`, `PORT`, `CI` |

```ts
import { config } from '@finance-ai/shared/config'

config.app.port
config.database.url
config.whatsapp.sessionPath
```

## Primeiro boot

`bootstrapAppSettings()` (em `server-ready.ts`):

1. Cria row `AppSettings` default
2. Gera `settingsEncryptionSecret` com `crypto.randomBytes(32)`
3. Cria diretórios `storage/*`, `logs/`

## Dados locais (não versionados)

| Path | Conteúdo |
|------|----------|
| `storage/whatsapp/` | Sessão Baileys |
| `storage/media/` | Mídias por chat |
| `storage/temp/` | Temporários |
| `packages/database/prisma/dev.db` | Mensagens e settings |
| `backups/` | Backups locais |
| `logs/` | Logs do launcher |

Somente `storage/.gitkeep` fica no Git. CI: `pnpm validate:repo-hygiene`.

## Variáveis `process.env` (somente CI/test/Docker)

| Variável | Uso |
|----------|-----|
| `NODE_ENV` | Ambiente |
| `PORT` | Override de porta em CI |
| `DATABASE_URL` | Path do SQLite em testes |
| `CI` | Ajustes de pipeline |
| `TZ` | Fuso em containers |
| `DOCKER_BUILD` | Build standalone Next |

## API keys de IA

Cadastre em **Dashboard → Configurações → Provedores**. Não use variáveis de ambiente para chaves.

## Docker

Documentação: [docs/deployment/docker.md](../deployment/docker.md). Passe apenas `NODE_ENV=production` e `DATABASE_URL` se necessário.
