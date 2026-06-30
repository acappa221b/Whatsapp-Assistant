# RC-21 — Suporte a caminhos UNC (rede) no launcher Windows

**Versão:** 1.5.3-rc21  
**Status:** implementado

## Objetivo

Permitir executar `Start WhatsApp Assistant.bat` a partir de pastas de rede UNC (`\\SERVER\share\...`) sem que o CMD caia em `C:\Windows` e o pnpm falhe com `ERR_PNPM_NO_PKG_MANIFEST`.

## Causa raiz

- `cd /d "%~dp0"` não funciona em UNC no CMD
- `spawn(..., { cwd: UNC, shell: true })` no Windows também falha
- pnpm roda em `C:\Windows` sem `package.json`

## Solução

1. **`.bat`:** `pushd` mapeia UNC para letra de unidade temporária; `WA_APP_ROOT=%CD%`
2. **`launch.mjs`:** `resolveAppRoot()` prioriza `WA_APP_ROOT`; `shell: false` para `.cmd`/`.exe`
3. **Scripts auxiliares:** `prisma-launcher`, `auto-update`, `ensure-node` usam o mesmo resolver
4. **auto-update:** skip em UNC não mapeado (git instável em rede)

## Critérios de aceite

| ID | Critério |
|----|----------|
| AC-01 | `.bat` em UNC não mostra erro "No package.json in C:\Windows" |
| AC-02 | `pnpm install` roda no diretório do projeto |
| AC-03 | Servidor sobe e dashboard abre a partir de UNC |
| AC-04 | Instalação em `C:\local\...` continua funcionando |
| AC-05 | Log do launcher registra `App root: Z:\...` após pushd |
| AC-06 | README documenta rede vs disco local |

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `Start WhatsApp Assistant.bat` | `pushd` / `popd`, `WA_APP_ROOT` |
| `scripts/resolve-app-root.mjs` | SSOT para ROOT |
| `scripts/launch.mjs` | `resolveAppRoot`, `shouldUseShell`, log diagnóstico |
| `scripts/prisma-launcher.mjs` | `resolveAppRoot` |
| `scripts/auto-update.mjs` | `resolveAppRoot`, skip UNC |
| `scripts/ensure-node.mjs` | `resolveAppRoot` |
