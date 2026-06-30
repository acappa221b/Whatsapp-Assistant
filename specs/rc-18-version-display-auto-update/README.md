# RC-18 — Versão no topo + auto-update + aviso GitHub

**Versão:** 1.5.0-rc18  
**Status:** implementado

## Objetivo

- SSOT em `version.json`
- Versão visível no header do dashboard
- Detecção de nova versão via GitHub raw `version.json`
- Auto-update no launcher (`git pull --ff-only`)
- Banner dismissível com instruções para reiniciar o `.bat`

## APIs

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/app/version` | Versão local + check remoto (`?refresh=1`) |
| PATCH | `/api/app/version` | Dismiss banner ou forçar check |

## Critérios de aceite

| ID | Critério |
|----|----------|
| AC-01 | Versão no topo em todas as páginas |
| AC-02 | SSOT `version.json` sem hardcode |
| AC-03 | Detecta versão mais nova no GitHub |
| AC-04 | Banner sugere reiniciar o .bat |
| AC-05 | Launcher faz `git pull --ff-only` |
| AC-06 | Após pull, `pnpm install` + migrate |
| AC-07 | Sem Git: modo manual |
| AC-08 | `storage/` intacto após update |
