# RC-19 — Bolha de áudio com transcrição + correção salvamento de API keys

**Versão:** 1.5.1-rc19  
**Status:** implementado

## Objetivo

### Parte A — Mensagens de áudio

- Bolha mostra `[Áudio]` e, quando habilitado, transcrição na mesma bolha
- Preview na sidebar usa transcrição truncada quando disponível
- Estado pendente: `[Áudio]` + "Transcrevendo…" (somente áudios recebidos)

### Parte B — Provedores IA

- Feedback claro ao salvar (sucesso/erro)
- Form não limpa em caso de erro
- Edição inline de API key (PATCH)
- Remoção com confirmação
- Bootstrap + validação nas rotas de providers
- Erro 409 em duplicata `provider + displayName`

## APIs

| Método | Rota | Alteração |
|--------|------|-----------|
| GET | `/api/whatsapp/archive/chats` | Inclui `audioProcessingEnabled` por chat |
| POST | `/api/settings/providers` | bootstrap, validação, P2002→409 |
| PATCH | `/api/settings/providers/[id]` | bootstrap, editar chave |
| DELETE | `/api/settings/providers/[id]` | bootstrap, remover |

## Componentes

| Arquivo | Função |
|---------|--------|
| `parseAudioMessageContent` | Normaliza prefixos `[audio]`, `[ÁUDIO]`, etc. |
| `AudioMessageBubble` | Renderização da bolha de áudio |
| `ProviderSettingsPanel` | UI de provedores com feedback e edição |

## Critérios de aceite

| ID | Critério |
|----|----------|
| AC-01 | Mensagem AUDIO mostra `[Áudio]` na bolha |
| AC-02 | Com áudio habilitado + transcrito → transcrição abaixo na mesma bolha |
| AC-03 | Com áudio habilitado + pendente → `[Áudio]` + "Transcrevendo…" |
| AC-04 | Sem áudio habilitado → só `[Áudio]`, sem transcrição nem pending |
| AC-05 | Salvar Gemini com nome + key → aparece na lista com máscara AIza...xxxx |
| AC-06 | Erro de duplicata → mensagem clara, form não limpa |
| AC-07 | Editar API key de provedor existente funciona (PATCH) |
| AC-08 | OpenAI, Gemini, DeepSeek passam em testes de persistência |
| AC-09 | Testar conexão Gemini retorna ok ou erro legível |
