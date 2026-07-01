# Investigação — Fresh clone: Prisma generate skipped

**Data:** 2026-07-01  
**Versão:** RC-26 (`1.7.1-rc26`)

## Sintomas

- `@prisma/client did not initialize yet. Please run "prisma generate"`
- `/api/whatsapp/status` e `/api/dashboard/metrics` retornam 500
- `JSON.parse: unexpected character` na UI (HTML de erro em vez de JSON)
- Aba Logs: "Não foi possível carregar os logs" — rota `/api/settings/logs` ausente

## Root cause

1. **`scripts/prisma-launcher.mjs`:** `needsPrismaGenerate()` usava `enginePath ?? clientPath`, onde `clientPath` é o pacote npm `@prisma/client` (sempre presente após `pnpm install`). Falso positivo → launcher pulava `db:generate`.

2. **`runDbGenerateSafe()`:** em falha de generate, continuava se `prismaClientExists()` fosse true (mesmo bug).

3. **RC-20 incompleto:** UI e repositório de logs existiam; rotas API não foram commitadas.

4. **`launch.mjs`:** `waitForHealth` só checava `/api/health` (sempre 200), abrindo o browser antes do banco estar utilizável.

## Fix

- Detectar apenas `.prisma/client` gerado
- `db:generate` obrigatório em todo boot do launcher
- `postinstall` com try/catch
- Implementar rotas de logs
- Gate: `/api/health` **e** `/api/health/database` antes de abrir browser

## Reprodução (antes do fix)

```bash
git clone ...
pnpm install
# sem db:generate
pnpm dev  # Prisma não inicializado
```

## Workaround imediato

```bash
pnpm db:migrate
pnpm db:generate
rmdir /s /q apps\dashboard\.next
Start WhatsApp Assistant.bat
```
