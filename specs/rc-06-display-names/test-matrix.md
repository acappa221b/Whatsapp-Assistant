# RC-06 — Matriz de testes

| ID | Área | Caso | Tipo |
|----|------|------|------|
| T-01 | Resolver | Prioridade contact.name > notify > pushName | Unit |
| T-02 | Resolver | contacts.upsert popula cache | Unit |
| T-03 | Mapper | mapBaileysMessage com resolver preenche chatName/senderName | Unit |
| T-04 | Mapper | Grupo com participant + pushName | Unit |
| T-05 | Core | StoreWhatsappMessageUseCase enriquece senderName tardio | Unit |
| T-06 | Core | EnsureWhatsappChatDiscoveredUseCase upgrade nome | Unit |
| T-07 | Core | BackfillWhatsappMessageNamesUseCase atualiza nulls | Unit |
| T-08 | Shared | resolveChatDisplayName fallback Grupo/Conversa | Unit |
| T-09 | Harness | Spec files existem | Harness |
| T-10 | Harness | Mapper não retorna chatName null com resolver | Harness |
| T-11 | Harness | API shape inclui nomes legíveis | Harness |
| T-12 | UI | message-archive-view sem displaySenderId | Harness |
