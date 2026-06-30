# ADR-021: Dual-Channel GitHub Auto-Update (Git + ZIP Overlay)

**Status:** aceito  
**Data:** 2026-06-30  
**Release:** RC-18B (v1.6.1-rc18b)  
**Estende:** [ADR-017](017-launcher-git-auto-update.md)

## Contexto

RC-18 implementou auto-update apenas para clones Git (`git pull --ff-only`). Usuários que baixaram ZIP do GitHub (sem pasta `.git`) recebiam `reason: 'no-git'` e precisavam atualizar manualmente — fonte de suporte e confusão.

## Decisão

1. **Dois canais, um orquestrador:** `scripts/update/index.mjs` (`runAutoUpdate`) escolhe Git ou ZIP automaticamente.
2. **ZIP overlay:** baixa `refs/heads/{branch}.zip`, extrai, copia arquivos novos **exceto** paths em `USER_DATA_PATHS` (SSOT em `@finance-ai/shared/update`).
3. **Rollback:** backup em `.update-backup/{timestamp}/` antes do overlay; restauração automática em falha parcial.
4. **Dashboard read-only:** compara versões e orienta "feche e abra o .bat" — nunca altera código em runtime.
5. **Estado local:** `storage/.update-state.json` (versão, método, data) após update bem-sucedido no launcher.
6. **ASCII no CMD:** mensagens do launcher sem acentos (RC-14C).

## Consequências

- Release discipline inalterada: bump `version.json` + push `main` + tag GitHub.
- ZIP users têm paridade de UX com Git users ao reabrir o `.bat`.
- Overlay não substitui `node_modules` nem `tools/node` — `pnpm install` pós-update continua obrigatório.
- UNC sem `pushd`: update bloqueado (ADR-019).

## Alternativas rejeitadas

- Atualizar com servidor Next rodando (race / arquivos bloqueados no Windows)
- Substituir pasta inteira incluindo `storage/` (perda de dados)
- Instalador `.exe` / Tauri (fora de escopo v1)
