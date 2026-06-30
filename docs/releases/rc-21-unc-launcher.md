# Release RC-21 — Suporte UNC no launcher Windows

**Versão:** 1.5.3-rc21 (PATCH)

## Novidades

- `Start WhatsApp Assistant.bat` funciona em pastas de rede (`\\servidor\pasta`)
- `pushd` mapeia UNC automaticamente para letra de unidade
- pnpm/corepack executam com `cwd` correto (não mais `C:\Windows`)
- Log diagnóstico: `App root: Z:\...` no `logs/launcher.log`
- README com seção de troubleshooting rede vs disco local

## Recomendação

Para uso diário em produção, copie o projeto para disco local (`C:\Users\...\WhatsApp-Assistant`). Rede pode ser lenta e SQLite em UNC é menos estável.

## Release discipline

1. Atualizar `version.json` e README
2. Tag: `v1.5.3-rc21`
3. Push para `main`
