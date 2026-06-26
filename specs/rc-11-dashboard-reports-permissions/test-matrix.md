# RC-11 — Matriz de testes

| Área | Teste |
|------|-------|
| Greetings | `should-auto-reply-to-message.test.ts` — oi/olá não skip; boa/kkkk skip |
| Agent | `process-agent-auto-reply.use-case.test.ts` — greeting gera sendMessage |
| Permissões | `whatsapp-chat-config-archive.test.ts` — v2 sem aiProcessing |
| Harness | `harness/rc-11` — API metrics, sem placeholders, permissões v2 |
| Analytics | queries Prisma via `DashboardAnalyticsPrismaRepository` |
