# Prompt log — RC-09 Chat names and media storage

**Data:** 2025-06-25  
**Versão:** 1.0.9-rc09

## Decisões

- `storageDir` persistido em `WhatsappChatConfig` para estabilidade de paths
- Permissões chama `resolve-names` no load + polling 5s até resolver
- Reset exige `--confirm` ou `RC09_RESET_CONFIRM=yes`
