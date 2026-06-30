# Release RC-18 — Version Bar + Launcher Auto-Update

**Versão:** 1.5.0-rc18 (MINOR)

## Novidades

- Badge de versão no header de todas as páginas do dashboard
- Verificação de atualização via GitHub (`version.json` remoto)
- Banner quando há versão mais nova
- Launcher executa `git pull --ff-only` antes de `pnpm install`
- Seção **Sobre** em Configurações → Geral

## Como atualizar (usuário final)

1. **Com Git (clone):** feche o programa e abra novamente `Start WhatsApp Assistant.bat` — a atualização é automática.
2. **Sem Git (ZIP):** baixe a nova versão no GitHub e copie por cima da pasta. Mantenha `storage/` e o banco.

## Release discipline

1. Atualizar `version.json` e README
2. Tag: `v1.5.0-rc18`
3. Push para `main` — usuários com clone recebem na próxima abertura do launcher
