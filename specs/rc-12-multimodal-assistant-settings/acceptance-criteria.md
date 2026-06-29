# RC-12 — Critérios de aceite

| ID | Critério |
|----|----------|
| AC-01 | Áudio com `audioProcessingEnabled` → `content` = `[ÁUDIO] {transcrição}` no DB e UI |
| AC-02 | Imagem sem `photoProcessingEnabled` → agent responde mensagem educada de “em breve” |
| AC-03 | Imagem com flag → descrição vision + resposta contextual |
| AC-04 | Relatório manual por chat/data na UI; auto no horário configurado |
| AC-05 | Chat IA responde pergunta sobre relatório salvo |
| AC-06 | “enviar olá para todos os contatos” → mensagem em chats `archiveEnabled` com confirmação |
| AC-07 | Configurações: cadastrar provedores; app usa key do banco; `.env` opcional |
| AC-08 | Menu: Permissões, Chat IA, Dashboard, Mensagens, WhatsApp, Relatórios, Configurações |
| AC-09 | `pnpm harness` verde (Rc12Harnesses) |
| AC-10 | `pnpm dev` reiniciado; smoke no release report |
