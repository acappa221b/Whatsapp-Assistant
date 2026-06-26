# RC-08B — Matriz de testes

| Área | Teste | Tipo |
|------|-------|------|
| Entity | `archiveEnabled=false` cascata ai + agent | Unit |
| Entity | `aiProcessingEnabled=true` sem archive → ValidationError | Unit |
| Entity | `agentChatEnabled=true` sem prereqs → ValidationError | Unit |
| Use case | `DeleteChatHistoryUseCase` deleta msgs, mídia, desabilita flags | Unit |
| Use case | `EnsureWhatsappChatDiscovered` cria com `archiveEnabled: false` | Unit |
| Repository | `listChatSummaries` filtra `archiveEnabled = true` | Unit |
| API | PATCH `archiveEnabled: false` → messages 403 | Integração |
| API | DELETE history → archive vazio para chatId | Integração |
| Harness | Spec files, schema, sidebar, rota DELETE, filtro archive | Harness |
| UI | Permissões carrega lista; switches; confirmação lixeira | Manual |
