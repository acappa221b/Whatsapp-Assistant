# RC-10 — Critérios de aceite

| ID | Critério |
|----|----------|
| AC-01 | Todo chat em Permissões exibe `#N` estável; mesmo `#N` em Mensagens para o mesmo `chatId` |
| AC-02 | Switch Resposta IA depende de Habilitado + IA |
| AC-03 | Com Resposta IA on, mensagem TEXT gera resposta `Teste IA: "..."` |
| AC-04 | Com histórico `fromMe`, resposta imita estilo do dono |
| AC-05 | Pergunta impossível → frase de espera + `agentPaused`; próximas sem auto-reply |
| AC-06 | Dono envia (`fromMe`) → `agentChatEnabled=false`; UI reflete após refresh |
| AC-07 | Religar Resposta IA limpa `agentPaused` e retoma auto-reply |
| AC-08 | Usa OpenAI real quando `OPENAI_API_KEY` configurada (validação manual) |
| AC-09 | `pnpm harness` verde |
