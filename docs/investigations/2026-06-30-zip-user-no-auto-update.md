# Investigação: usuário ZIP sem auto-update

**Data:** 2026-06-30  
**Release:** RC-18B  
**Severidade:** média (UX / suporte)

## Sintomas

- Usuário baixou repositório como ZIP do GitHub e extraiu em `C:\Users\...\Whatsapp-Assistant-main\`
- Ao abrir `Start WhatsApp Assistant.bat`, programa iniciava na versão antiga
- Banner no dashboard pedia download manual do GitHub
- `logs/update.log` ou launcher mostrava `reason: 'no-git'`

## Reprodução

1. Baixar ZIP de `main` sem clonar
2. Extrair — não existe pasta `.git`
3. Executar `.bat` com versão local anterior à remota em `version.json` no GitHub
4. RC-18: `auto-update.mjs` retornava early sem atualizar

## Causa raiz

RC-18 limitou auto-update a `git pull --ff-only` quando `.git` existe. Instalações ZIP nunca entravam nesse caminho.

## Correção (RC-18B)

- `runAutoUpdate` → se sem Git: `updateViaZip` (download + overlay + rollback)
- Paths protegidos garantem `storage/`, `*.db`, `.env` intactos
- Banner e Configurações → Sobre orientam reiniciar o `.bat`

## Cenários de teste manual

| Cenário | Resultado esperado |
|---------|-------------------|
| ZIP v1.6.0, remote 1.6.1 | Overlay OK, DB e sessão WhatsApp intactos |
| Git clone 1 commit behind | `git pull --ff-only` OK |
| Git com mudanças locais | Skip + mensagem stash |
| Sem internet | Boot normal, log WARN |
| UNC com pushd | Update OK |
| Usuário declina `[n]` | Boot versão antiga |

## Arquivos afetados

- `scripts/update/*`
- `packages/shared/src/update/*`
- `apps/dashboard/src/lib/app/check-for-updates.ts`
- `apps/dashboard/src/components/layout/update-available-banner.tsx`
