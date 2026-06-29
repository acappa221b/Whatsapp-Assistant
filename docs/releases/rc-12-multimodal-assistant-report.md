# Release RC-12 — Multimodal assistant & settings

**Versão:** 1.3.0-rc12  
**Data:** 2025-06-26

## Entregas

- Transcrição áudio → `[ÁUDIO]` em `WhatsappMessage.content`
- Vision fotos → `[FOTO]` + agent reply
- Agent TEXT/AUDIO/IMAGE
- Relatórios: UI chat dropdown + date picker + agendamento `AppSettings`
- Chat IA + broadcast confirmado
- Configurações multi-provedor

## Smoke test

1. `pnpm db:migrate && pnpm db:generate`
2. `pnpm dev` — abrir `/dashboard/settings`, cadastrar OpenAI
3. Habilitar Áudio/Foto/Resposta IA em Permissões
4. Enviar áudio → ver `[ÁUDIO]` em Mensagens
5. Enviar foto sem Foto → resposta “em breve”
6. `/dashboard/reports` — gerar manual + salvar horário auto
7. `/dashboard/assistant` — pergunta sobre relatório

## Reinício

`WHATSAPP_RUNTIME_VERSION=9` — reiniciar `pnpm dev` após deploy.
