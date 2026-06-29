# Release RC-14 — OSS zero-config + WhatsApp Messages UI

**Versão:** 1.4.0-rc14  
**Data:** 2025-06-26

## Highlights

- Mensagens com UI estilo WhatsApp (bolhas, composer, auto-scroll)
- Dashboard viewport-locked; scroll independente por painel
- Arquitetura zero `.env` — config e secrets no banco
- Launcher: `Start WhatsApp Assistant.bat` / `pnpm launch`
- Wizard de primeiro uso em Configurações

## Breaking changes

- `.env.example` removido — configurar provedores IA no dashboard
- `OPENAI_API_KEY` não é mais lida de variáveis de ambiente

## Validação

```bash
pnpm db:migrate && pnpm db:generate
pnpm test:unit && pnpm typecheck
pnpm harness
pnpm validate:repo-hygiene
pnpm build
```
