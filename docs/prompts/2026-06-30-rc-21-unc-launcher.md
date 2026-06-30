# Prompt — RC-21 UNC launcher

**Data:** 2026-06-30  
**Versão:** 1.5.3-rc21

## Objetivo

Corrigir falha `ERR_PNPM_NO_PKG_MANIFEST` em `C:\Windows` quando o `.bat` é executado de pasta UNC de rede.

## Arquivos gerados/alterados

- `Start WhatsApp Assistant.bat` — pushd/popd, WA_APP_ROOT
- `scripts/resolve-app-root.mjs` — resolveAppRoot, isUncPath
- `scripts/launch.mjs` — ROOT via env, shell fix, log diagnóstico
- `scripts/prisma-launcher.mjs`, `auto-update.mjs`, `ensure-node.mjs` — alinhados
- `scripts/resolve-app-root.test.mjs` — testes unitários
- `harness/rc-21/`, docs SDD, README troubleshooting

## Decisões

- `pushd` no `.bat` (não `subst` permanente)
- `WA_APP_ROOT` como contrato entre .bat e Node
- auto-update skip em UNC não mapeado
