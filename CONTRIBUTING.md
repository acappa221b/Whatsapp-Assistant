# Contributing

Obrigado por contribuir com o WhatsApp Assistant.

## Desenvolvimento local (sem `.env`)

### Windows (usuário final)

Duplo-clique em `Start WhatsApp Assistant.bat` — Node é baixado automaticamente na primeira execução.

### Desenvolvedores

1. Node.js 20+ (Mac/Linux: instalação manual; Windows: opcional se usar o `.bat`)
2. `pnpm install`
3. `pnpm db:migrate && pnpm db:generate`
4. `pnpm dev` ou `pnpm launch`
5. Configure provedores IA em **Configurações** no dashboard

O app **não lê** arquivo `.env`. Overrides de ambiente são apenas para CI/test (`NODE_ENV`, `DATABASE_URL`, `PORT`).

## O que nunca commitar

- `storage/` (sessão WhatsApp, mídias)
- `packages/database/prisma/*.db`
- `backups/`
- `logs/`
- `tools/node/` (Node portátil baixado pelo launcher no Windows)
- Chaves de API ou `creds.json`

Validação: `pnpm validate:repo-hygiene`

## Antes de abrir PR

```bash
pnpm test:unit
pnpm typecheck
pnpm harness
pnpm build
```

## Spec Driven Development

Alterações de comportamento exigem spec em `specs/` e atualização do `README.md`.
