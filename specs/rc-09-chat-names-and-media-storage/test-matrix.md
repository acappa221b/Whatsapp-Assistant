# RC-09 — Matriz de testes

| Área | Teste | Tipo |
|------|-------|------|
| Storage | `buildChatDirName` unicidade/acentos | Unit |
| Storage | `ChatMediaStorage.ensureChatStructure` | Unit |
| Nomes | `ResolveChatNamesUseCase` mock groupMetadata | Unit |
| Delete | `DeleteChatHistoryUseCase` pasta recursiva | Unit |
| API | `POST resolve-names` | Integração |
| Script | reset dry-run vs confirm | CLI |
| Harness | rc-09 spec + paths + UI | Harness |
