# Prompt log — RC-10 agent chat

**Data:** 2025-06-25  
**Versão:** 1.1.0-rc10

## Objetivo

ID `#N` por chat, resposta automática OpenAI, `sendMessage` Baileys, switch Resposta IA.

## Arquivos gerados/alterados

- Schema + migration `displayNumber`, `agentPaused*`
- Domínio `agent-chat`, `OpenAIChatProvider`
- UI Permissões/Mensagens, APIs, harness `rc-10`

## Decisões

- Prefixo `Teste IA:` mantido em v1 (debug)
- Takeover em qualquer `fromMe` exceto eco do agente
- Deferral pausa até religar Resposta IA
