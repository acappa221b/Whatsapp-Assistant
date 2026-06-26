# Media Security

## Controles obrigatórios

- validação de `mimeType`
- rejeição de arquivo vazio
- limite de tamanho
- validação básica de assinatura do arquivo
- prevenção de path traversal
- nenhum arquivo salvo fora de `MEDIA_STORAGE_PATH`

## Preview e download

As rotas:

- `/api/whatsapp/messages/[id]/preview`
- `/api/whatsapp/messages/[id]/download`

nunca recebem caminho arbitrário do cliente.

Elas:

1. carregam a mensagem pelo `id`
2. usam o `storagePath` persistido
3. resolvem o caminho absoluto dentro de `MEDIA_STORAGE_PATH`
4. retornam `Content-Type` e `Content-Disposition` controlados
