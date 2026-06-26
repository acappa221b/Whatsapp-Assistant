# RC-09 — Nomes confiáveis + armazenamento por chat

**Versão alvo:** 1.0.9-rc09

## Objetivo

Nomes 100% confiáveis em Permissões/Mensagens, mídia organizada por chat, delete completo (pasta recursiva) e reset geral.

## Escopo IN

- `ResolveChatNamesUseCase` + `POST /api/whatsapp/chats/resolve-names`
- `ChatMediaStorage` com `{chatDir}/photos|audio|messages|reports/`
- `WhatsappChatConfig.storageDir`
- Delete histórico remove pasta inteira do chat
- `pnpm rc:09:reset-all-history --confirm`
- UI Permissões sem label genérico "Conversa" duplicado

## Escopo OUT

- Whisper/transcrição (só paths preparados)
- IA conversacional automática
- syncFullHistory Baileys
