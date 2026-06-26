# RC-08B — Critérios de aceite

| ID | Critério |
|----|----------|
| AC-01 | Menu lateral exibe **Permissões** como primeiro item; navega para `/dashboard/permissions` |
| AC-02 | Lista mostra todos os chats em `WhatsappChatConfig` |
| AC-03 | Switch **Habilitado** persiste `archiveEnabled`; chat aparece/desaparece em Mensagens (polling 8s OK) |
| AC-04 | Switch **IA** desabilitado quando Habilitado = false; quando Habilitado = true, IA pode ligar/desligar |
| AC-05 | Desligar Habilitado desliga IA automaticamente no banco |
| AC-06 | Lixeira apaga histórico (mensagens + mídia); chat some de Mensagens; permanece em Permissões com Habilitado = false |
| AC-07 | Mensagens continuam capturadas pelo Baileys com Habilitado = false |
| AC-08 | Chats existentes com mensagens mantêm `archiveEnabled = true` após migration (backfill) |
| AC-09 | `pnpm harness` verde incluindo rc-08b |
| AC-10 | README atualizado com novo menu e governança |
