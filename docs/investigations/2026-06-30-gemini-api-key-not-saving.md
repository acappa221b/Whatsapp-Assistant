# Investigação — Gemini API key não salvava (RC-19)

**Data:** 2026-06-30  
**Sintoma:** Usuário não conseguiu salvar API key do Gemini; OpenAI funcionou.

## Hipóteses testadas

| Hipótese | Resultado |
|----------|-----------|
| POST falha silenciosamente na UI (sem checar `res.ok`) | **Confirmado** — `addProvider()` limpava o form e não exibia erro |
| Duplicata `provider + displayName` → erro 500 sem mensagem | **Confirmado** — constraint `@@unique([provider, displayName])` sem tratamento P2002 |
| Nome exibido vazio → return silencioso no client | **Confirmado** — validação só no client sem feedback visível em alguns fluxos |
| Gemini bloqueado no backend | **Descartado** — mesmo fluxo que OpenAI (`VALID_PROVIDERS` inclui `gemini`) |
| Decrypt falha ao mascarar | Parcial — provider pode aparecer com `****` mas estar salvo; não era a causa principal |

## Causa raiz

1. **UI:** ausência de feedback de erro e limpeza do formulário independente do status HTTP.
2. **API:** `POST /api/settings/providers` sem `try/catch`, sem `bootstrapAppSettings()`, sem mapeamento de P2002.
3. **UX:** sem UI para editar chave existente (PATCH existia mas não era exposto).

## Reprodução manual

1. Configurações → Provedores → Gemini, nome "Gemini", key válida → deve aparecer na lista com máscara `AIza...xxxx`
2. Tentar salvar de novo com mesmo nome → deve mostrar erro claro (409), form preservado
3. Testar OpenAI, Gemini, DeepSeek, custom — todos persistem e decryptam
4. Editar provedor → nova key via PATCH → Testar conexão

## Correção

- `ProviderSettingsPanel` com `providerError` / `providerSuccess`, validação client, PATCH inline
- Rotas `GET/POST/PATCH/DELETE` com `bootstrapAppSettings()` e erros estruturados
- Dica contextual: Gemini para Chat/Vision; Whisper (OpenAI) para transcrição de áudio

## Arquivos afetados

- `apps/dashboard/src/app/api/settings/providers/route.ts`
- `apps/dashboard/src/app/api/settings/providers/[id]/route.ts`
- `apps/dashboard/src/components/settings/provider-settings-panel.tsx`
- `apps/dashboard/src/app/dashboard/settings/page.tsx`
