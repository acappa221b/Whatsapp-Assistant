# RC-30 — Reset dados WhatsApp + sync manual + chip de status

**Versão:** 1.7.4-rc30

## Escopo

### A — Reset de dados WhatsApp
- Use case `ResetWhatsappDataUseCase` apaga mensagens, chats, relatórios, assistente, extrações e fila de aprovação
- Mantém `AppSettings`, provedores IA, persona, conhecimento, `ApiTokenUsage`, `AppLog`, sessão Baileys
- Limpa `storage/media/*` (mantém `.gitkeep`)
- API `POST /api/settings/reset-whatsapp-data` com `{ confirm: "RESETAR" }`
- UI Configurações → WhatsApp → Zona de perigo

### B — Sincronização manual
- `runManualContactSync()` no runtime
- `resetSyncStateForManualRun()` no tracker
- `reconnectForSync()` no provider Baileys
- API `POST /api/whatsapp/sync-contacts`
- Botão **Iniciar sincronização** em Permissões quando lista vazia e conectado

### C — Chip sutil
- `ContactSyncChip` inline ao lado do título
- Remove banners full-width que deslocam a tabela
- Polling 2s em sync; 10s quando completed com contatos

## Critérios de aceite

| ID | Critério |
|----|----------|
| AC-01 | Reset com RESETAR apaga mensagens + chats + relatórios + mídia |
| AC-02 | Após reset, #N recomeça em 1 |
| AC-03 | Configurações, IA e métricas permanecem |
| AC-04 | Sessão WhatsApp não é apagada |
| AC-05 | Botão Iniciar sincronização visível se conectado e vazio |
| AC-06 | Chip Sincronizando… sem banner empurrando tabela |
| AC-07 | Chip Sincronizado ao lado do título |
| AC-08 | Tabela não muda de posição quando sync muda |
| AC-09 | Logs registram reset e sync manual |
