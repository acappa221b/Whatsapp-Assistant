# Investigação — Permissões sync chip UX (RC-28 → RC-30)

## Sintomas

- Banner verde "Sincronização concluída" aparecia repetidamente no topo de Permissões
- Banner empurrava a tabela para baixo a cada ciclo de polling
- Banner azul "Nenhum contato novo…" ocupava largura total

## Causa raiz

`ContactSyncBanner` usava `completedVisible` com timeout de 5s re-disparado a cada poll quando `status === 'completed'`. Layout `block` full-width acima da tabela.

`applyTimeoutRules` podia reescrever `message` em estado syncing, alternando mensagens exibidas.

## Correção (RC-30)

- Substituir banner por `ContactSyncChip` (`inline-flex`, `h-6`, ao lado do `<h1>`)
- Estado `completed` permanente no chip ("● Sincronizado")
- `applyTimeoutRules` retorna cedo para `completed` e `error`
- Loading inicial dentro da área da tabela (skeleton), não no topo global

## Arquivos

- `apps/dashboard/src/components/permissions/contact-sync-chip.tsx`
- `apps/dashboard/src/components/permissions/chat-permissions-view.tsx`
- `apps/dashboard/src/lib/whatsapp/contact-sync-tracker.ts`
