# ADR-019 — Windows UNC paths via pushd in launcher

**Status:** aceito  
**Data:** 2026-06-30  
**RC:** RC-21

## Contexto

Usuários corporativos executam o WhatsApp Assistant a partir de compartilhamentos de rede (`\\SERVER\share\...`). O CMD do Windows não suporta UNC como diretório atual; Node `spawn` com `shell: true` herda `C:\Windows`.

## Decisão

1. **`pushd` / `popd`** no `.bat` para mapear UNC temporariamente a uma letra de unidade.
2. **`WA_APP_ROOT`** como variável de ambiente passada ao Node — SSOT para todos os scripts do launcher.
3. **`scripts/resolve-app-root.mjs`** centraliza a resolução de ROOT.
4. **`shell: false`** ao invocar `.cmd` / `.exe` no Windows (pnpm, corepack).
5. **auto-update** desabilitado em UNC não mapeado (git em rede é instável).

## Alternativas consideradas

| Alternativa | Motivo rejeição |
|-------------|-----------------|
| Copiar sempre para disco local no boot | UX ruim; usuário quer rodar direto da rede |
| `subst` permanente | Requer permissão admin; `pushd` é built-in |
| Apenas documentar "não use rede" | Não resolve o caso reportado |

## Consequências

- Logs mostram `App root: Z:\...` em UNC (drive temporário do `pushd`)
- Produção em rede: SQLite e `node_modules` em UNC são menos estáveis — README recomenda disco local
- Scripts que derivam ROOT devem importar `resolve-app-root.mjs`

## Referências

- [Investigação UNC](2026-06-30-unc-network-path-launcher-failure.md)
- Spec: `specs/rc-21-unc-path-launcher/`
