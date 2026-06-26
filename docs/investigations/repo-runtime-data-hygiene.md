# Investigação — Hygiene de dados runtime no Git

**Data:** 2026-06-26

## Sintoma

Repositório preparado para push no GitHub continha dados locais sensíveis no índice Git.

## Diagnóstico (`git ls-files`)

| Path | Resultado |
|------|-----------|
| `storage/` | **Centenas de arquivos tracked** — sessão Baileys completa (`creds.json`, `pre-key-*.json`, `session-*.json`, `sender-key-*.json`, `app-state-sync-*`) |
| `storage/media/` | Não tracked (untracked/ignored após fix) |
| `*.db` | Não tracked |
| `backups/` | Não tracked |
| `.env` | Não tracked |
| `apps/dashboard/.next/` | Não tracked |

## Causa

`.gitignore` não incluía `storage/` na raiz; arquivos de sessão WhatsApp foram adicionados ao stage (`git add`) antes das regras de hygiene.

## Correção

1. Expandir `.gitignore` — `storage/`, `backups/`, `*.db*`, reforço `.next/`
2. `git rm -r --cached storage/` — remove do índice, **mantém no disco**
3. Versionar apenas `storage/.gitkeep`
4. Script `pnpm validate:repo-hygiene` + CI + harness

## Verificação pós-fix

```bash
git ls-files storage/   # → storage/.gitkeep apenas
pnpm validate:repo-hygiene
```
