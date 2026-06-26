# RC-10 — Matriz de testes

| Área | Teste | Tipo |
|------|-------|------|
| `formatAgentOutbound` | aspas e prefixo | unit |
| `formatChatListLabel` | com/sem nome | unit |
| `WhatsappChatConfig` | cascade + `agentPaused` reset | unit |
| `ProcessAgentAutoReplyUseCase` | reply / defer / paused skip | unit |
| `HandleHumanTakeoverUseCase` | desliga agent | unit |
| `BaileysWhatsappProvider.sendMessage` | mock socket | unit |
| Harness `rc-10` | schema, provider, pipeline, UI | harness |
| OpenAI real | fluxo manual com `.env` | manual |
