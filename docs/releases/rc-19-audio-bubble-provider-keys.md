# Release RC-19 — Audio Bubble + Provider Key Fixes

**Versão:** 1.5.1-rc19 (PATCH)

## Novidades

### Mensagens

- Áudios exibem `[Áudio]` na bolha
- Com transcrição habilitada no chat: texto transcrito abaixo na mesma bolha
- Estado pendente: "Transcrevendo…" para áudios recebidos
- Preview na sidebar usa transcrição quando disponível

### Configurações → Provedores IA

- Mensagem verde ao salvar com sucesso; vermelha em erro (form preservado)
- Editar API key, modelo e base URL de provedores existentes
- Remover provedor com confirmação
- Erro claro em duplicata (mesmo tipo + nome)
- Dica: Gemini para Chat/Vision; OpenAI (Whisper) para transcrição de áudio

## Checklist pós-atualização (Gemini)

1. Configurações → **Provedores IA**
2. Tipo: **Gemini**
3. Nome: **Gemini** (ou qualquer nome único)
4. Colar API key do Google AI Studio
5. Clicar **Salvar provedor** — deve aparecer mensagem verde
6. Clicar **Testar** — deve retornar "Conexão OK"
7. Em **Provedor por função**, escolher Gemini para Chat/Vision conforme necessário
8. **Transcrição de áudio:** usar provedor OpenAI (Whisper)

## Release discipline

1. Atualizar `version.json` e README
2. Tag: `v1.5.1-rc19`
3. Push para `main`
