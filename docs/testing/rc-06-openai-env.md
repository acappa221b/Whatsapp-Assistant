# RC-06 — Resolução do carregamento da OPENAI_API_KEY

Data: 2026-06-24  
Versão app: `0.0.9`

## Sintoma

WhatsApp conectado e mensagens chegando ao pipeline, mas `OpenAIExtractionProvider` falhava com **401** (`You didn't provide an API key`). A chave existia em `.env` na raiz do repositório.

## Causa raiz

Em `packages/shared/src/config/index.ts`, `createConfig()` **pulava** o carregamento do `.env` da raiz quando `DATABASE_URL` já estava presente em `process.env`:

```typescript
// comportamento removido (RC-06)
const shouldSkipEnvFile =
  typeof rawEnv.DATABASE_URL === 'string' && rawEnv.DATABASE_URL.length > 0
```

No runtime do Next.js:

1. `next.config.ts` injeta `DATABASE_URL` (e outras vars) via bloco `env`.
2. `createConfig(process.env)` via `getConfig()` / provider viaia esse atalho.
3. O arquivo `.env` da raiz **não era mesclado** → `OPENAI_API_KEY` ficava vazia.
4. `OpenAI` SDK era instanciado com `apiKey: ''` → erro 401.

O `.env` do monorepo fica em `C:\Dev\Dashboard-UNIQUE\.env`, enquanto o app Next vive em `apps/dashboard` — o carregamento explícito via `loadRootEnvFile()` é obrigatório.

## Correções aplicadas

| Arquivo | Mudança |
|---|---|
| `packages/shared/src/config/index.ts` | Sempre mescla `loadRootEnvFile()` + `process.env` (exceto `skipEnvFile: true` explícito em testes) |
| `packages/shared/src/config/openai.config.ts` | `logOpenAIApiKeyPresence()` — log seguro (nunca imprime a chave) |
| `packages/database/src/startup-validation.ts` | Chama `logOpenAIApiKeyPresence` no boot |
| `apps/dashboard/src/lib/server-ready.ts` | `resetConfigCache()` antes de `createConfig()` no startup |
| `packages/ai/src/providers/openai-extraction.provider.ts` | Fallback `config.openai.apiKey \|\| process.env.OPENAI_API_KEY` |
| `packages/shared/src/config/config.test.ts` | Teste de merge com `.env` quando só `DATABASE_URL` no process |

### Log de startup (seguro)

Chave **ausente**:
```
[OpenAI] Erro: OPENAI_API_KEY não foi carregada no ambiente local
```

Chave **presente**:
```
[OpenAI] OPENAI_API_KEY presente no ambiente (valor omitido por segurança)
```

### Cadeia de injeção após RC-06

```
.env (repo root)
  → loadRootEnvFile()
  → createConfig({ ...process.env })   // process.env sobrescreve .env
  → config.openai.apiKey
  → OpenAIExtractionProvider(apiKey)
```

`next.config.ts` continua mapeando `OPENAI_API_KEY: sharedConfig.openai.apiKey` no bloco `env` para compatibilidade com bundles Next.

## Validação

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ pass |
| `pnpm typecheck` | ✅ pass |
| `pnpm build` | ✅ pass |

### Comportamento esperado pós-fix

1. Subir `pnpm dev` → log `[OpenAI] OPENAI_API_KEY presente no ambiente` no primeiro `ensureServerReady` ou rota que valida startup.
2. Enviar mensagem WhatsApp → pipeline chama OpenAI **sem** 401 por chave ausente.
3. Provider inicializa com `apiKey` não vazia (`typeof key === 'string' && key.length > 0`).

## Premissas mantidas

- Sem Epic 08
- Sem alteração de regras de negócio do pipeline
- Proxy local sem autenticação inalterado

## Pendência operacional

Reiniciar o dev server após o deploy local do fix para limpar cache de `getConfig()` e validar extração com mensagem real.
