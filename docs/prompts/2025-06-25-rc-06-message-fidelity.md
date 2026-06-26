# Prompt — RC-06 Message Fidelity

**Timestamp:** 2025-06-25  
**Versão alvo:** 1.0.6-rc06f

## Objetivo

Investigar e corrigir qualidade de dados WhatsApp: nomes de chat, texto TEXT vazio, imagens `[imagem]`, métricas e diagnóstico.

## Arquivos gerados/alterados

- `specs/rc-06-message-fidelity/*`
- `packages/whatsapp/src/utils/chat-contact-resolver.ts`
- `packages/core/.../message-fidelity.use-case.ts`
- `packages/database/.../getFidelityMetrics`
- `apps/dashboard/src/app/api/whatsapp/fidelity/route.ts`
- `apps/dashboard/src/app/dashboard/diagnostics/page.tsx`
- `harness/rc-06-message-fidelity/`
- `docs/investigations/rc-06-image-processing.md`

## Decisões

1. `ChatContactResolver` centraliza regras DM/grupo/self-chat
2. `fromMe` nunca persiste `pushName` como `chatName` em DM
3. `[image]` sem caption não é bug — OCR genérico fora de escopo
4. Versão `1.0.6-rc06f` para não colidir com RC-06 display names (1.0.4) e RC-07 (1.0.5)
