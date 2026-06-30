# Release RC-20 — Aba Logs em Configurações

**Versão:** 1.5.2-rc20 (PATCH)

## Novidades

- Nova aba **Logs** em Configurações
- Lista erros e eventos do servidor com filtro **Somente erros** ou **Todos**
- Filtro por domínio (WhatsApp, API, IA, Launcher, etc.)
- Busca por texto, auto-refresh a cada 5s
- Exportar `.txt` para enviar ao suporte
- Logs do `Start WhatsApp Assistant.bat` (`launcher.log`) mesclados com etiqueta launcher
- API keys mascaradas automaticamente nos logs

## Ver logs e pedir ajuda

1. Abra **Configurações → Logs**
2. Se algo falhou, use **Somente erros**
3. Clique **Exportar .txt** e envie o arquivo para quem está te ajudando
4. Logs do programa (`.bat`) também aparecem com etiqueta **launcher**

## Release discipline

1. Atualizar `version.json` e README
2. Tag: `v1.5.2-rc20`
3. Push para `main`
