# RC-10B — Critérios de aceite

| ID | Critério |
|----|----------|
| AC-01 | "boa", "kkkkk", "Boaaa" → zero mensagens enviadas |
| AC-02 | Thread pergunta → ack → status incremental → silêncio (sem 2ª msg igual) |
| AC-03 | Mesma replyText que última outbound → não reenvia |
| AC-04 | Resposta com convite/aceite → defer + pause |
| AC-05 | Pergunta nova legítima ainda recebe resposta |
| AC-06 | skip não altera `agentPaused` |
| AC-07 | Logs `[AgentChat] skip` com `reason` |
