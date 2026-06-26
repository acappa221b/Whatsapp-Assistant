# RC-06 Message Fidelity — Acceptance Criteria

- **AC-01** — DM chat list shows interlocutor name, not authenticated user's pushName
- **AC-02** — Self-chat (own JID) may show own name
- **AC-03** — TEXT messages persist original text when available in payload
- **AC-04** — API/UI do not show "Mensagem de texto" when DB has real content
- **AC-05** — Image processing steps logged with `[RC-06F/image]`
- **AC-06** — `GET /api/whatsapp/fidelity` returns rates
- **AC-07** — `/dashboard/diagnostics` displays fidelity snapshot
- **AC-08** — Harness rc-06-message-fidelity green
