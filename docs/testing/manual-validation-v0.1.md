# Manual Validation v0.1

## Objetivo

Executar validacao manual local da aplicacao correspondente ao estado `0.0.9`, sem implementar novas funcionalidades, e registrar o comportamento observado antes da Epic 08.

## Ambiente utilizado

- OS: Windows 11 (`10.0.22631`)
- Shell: PowerShell
- Workspace: `c:/Dev/Dashboard-UNIQUE`
- Porta validada: `http://localhost:4000`
- Node/pnpm: conforme ambiente local do workspace
- Aplicacao alvo: `Finance AI Dashboard`

## Configuracao utilizada

- Arquivo base: `.env`
- Observacao relevante: `.env` ainda declara `APP_VERSION=0.0.8`, apesar do repositorio estar em `0.0.9`
- Banco original local: `file:./packages/database/prisma/dev.db`
- Tentativa adicional para RC isolada: SQLite alternativo `rc-v0.1.db`

## Limitacoes desta validacao

- Nao houve captura grafica de screenshots nesta execucao, pois a validacao foi realizada por terminal e requisicoes HTTP locais.
- Nao foi possivel concluir validacao com aparelho WhatsApp real conectado nesta rodada.
- A validacao manual ficou parcialmente bloqueada por problemas de banco/migracao e por falhas de API em runtime.

## Resumo executivo

Status geral da RC: **reprovada para avancar como base confiavel da Epic 08**.

Principais motivos:

1. `pnpm db:migrate` nao e repetivel em ambiente local existente por drift do banco e solicitacao de reset destrutivo.
2. Mesmo em tentativa com banco isolado, as rotas `api/whatsapp/messages` e `api/extractions` retornaram `500`.
3. O `api/health` respondeu versao `0.0.1`, divergente do estado real do repositorio (`0.0.9`).
4. `api/whatsapp/connect` falhou durante a validacao, impedindo fechamento do fluxo de QR/conexao/reconexao.

## Execucao por etapa

### 1. Inicializacao da aplicacao

| Passo | Resultado esperado | Resultado obtido | Status |
|---|---|---|---|
| `pnpm install` | Dependencias resolvidas sem erro | Executado com sucesso | Aprovado |
| `pnpm db:generate` | Prisma Client gerado | Executado com sucesso | Aprovado |
| `pnpm db:migrate` no banco original | Migrations aplicadas sem interacao manual | Falhou com drift e pedido de reset do `dev.db` | Reprovado |
| `pnpm dev` | Aplicacao sobe em `localhost:4000` | Aplicacao subiu e respondeu na porta 4000 | Aprovado com ressalvas |

### 2. Dashboard

Validacao feita por resposta HTTP das paginas:

| Rota | Resultado esperado | Resultado obtido | Status |
|---|---|---|---|
| `/` | Pagina inicial responde | `200` | Aprovado |
| `/dashboard/messages` | Pagina responde | `200` | Aprovado |
| `/dashboard/pipeline` | Pagina responde | `200` | Aprovado |
| `/dashboard/extractions` | Pagina responde | `200` | Aprovado |
| `/dashboard/whatsapp` | Pagina responde | `200` | Aprovado |

Observacao: a navegacao basica responde, mas isso nao garante que os dados internos estejam saudaveis, pois parte das APIs associadas falhou.

### 3. WhatsApp

| Item | Resultado esperado | Resultado obtido | Status |
|---|---|---|---|
| `GET /api/whatsapp/status` | Estado atual do provider | Respondeu `200` com `disconnected` | Parcial |
| `POST /api/whatsapp/connect` | Iniciar fluxo de conexao/QR | Retornou `500` | Reprovado |
| `POST /api/whatsapp/disconnect` | Desconectar com seguranca | Retornou `{"ok":true,"status":"disconnected"}` | Aprovado |
| QR Code | Disponibilizar QR quando aplicavel | Nao validado; fluxo de connect falhou | Bloqueado |
| Reconexao | Reconectar apos fechamento | Nao validado | Bloqueado |
| Persistencia de sessao | Sessao reutilizada apos reinicio | Nao validado | Bloqueado |

### 4. Mensagens de texto

Exemplos solicitados:

- `balas 4 reais`
- `gasolina 120 reais`
- `recebi 500 reais do cliente joao`

Resultado:

- Nao foi possivel validar manualmente pelo app local com WhatsApp real nesta rodada.
- A cadeia manual `recebimento -> pipeline -> extraction` ficou bloqueada por falhas nas APIs de leitura de mensagens e extractions.
- A cobertura automatizada existente do repositorio permaneceu verde, mas isso nao substitui a validacao manual pedida.

Status: **Bloqueado**

### 5. Imagens

Itens solicitados:

- cupom fiscal
- nota simples
- comprovante

Resultado:

- Nao foi possivel validar envio real pelo WhatsApp.
- Preview e fluxo de armazenamento nao puderam ser confirmados manualmente em runtime por causa do bloqueio da camada de mensagens/extractions.

Status: **Bloqueado**

### 6. PDFs

Resultado:

- Nao foi possivel validar envio real pelo WhatsApp nem o fluxo completo de preview pelo app local.

Status: **Bloqueado**

### 7. Reinicio da aplicacao

O reinicio do servidor foi exercitado durante a investigacao.

| Item | Resultado esperado | Resultado obtido | Status |
|---|---|---|---|
| Reiniciar app | Subir novamente em `4000` | Sim, com necessidade de matar processos orfaos da porta 4000 | Parcial |
| WhatsApp conectado apos restart | Sessao reutilizada | Nao validado | Bloqueado |
| Banco preservado | Dados disponiveis apos restart | Nao validado funcionalmente por falhas de schema/runtime | Bloqueado |
| Mensagens preservadas | Historico acessivel | Nao validado | Bloqueado |
| Extractions preservadas | Historico acessivel | Nao validado | Bloqueado |

### 8. APIs

| Endpoint | Resultado esperado | Resultado obtido | Status |
|---|---|---|---|
| `GET /api/health` | Healthcheck coerente com a versao | `200`, mas respondeu `version: 0.0.1` | Reprovado |
| `GET /api/whatsapp/status` | Estado do provider + contadores | `200` | Aprovado |
| `GET /api/whatsapp/messages` | Lista de mensagens | `500` | Reprovado |
| `GET /api/pipeline/jobs` | Lista de jobs | `200` com `items: []` | Aprovado |
| `GET /api/extractions` | Lista de extractions | `500` | Reprovado |
| `GET /api/whatsapp/messages/[id]/preview` com id invalido | `404` controlado | `500` | Reprovado |
| `GET /api/whatsapp/messages/[id]/download` com id invalido | `404` controlado | `500` | Reprovado |
| `POST /api/whatsapp/connect` | Inicio do fluxo de QR | `500` | Reprovado |
| `POST /api/whatsapp/disconnect` | Desconexao controlada | `200` | Aprovado |

### 9. Seguranca

Itens validados na camada manual disponivel:

| Cenario | Resultado esperado | Resultado obtido | Status |
|---|---|---|---|
| Arquivo inexistente por id invalido em preview | `404` | `500` | Reprovado |
| Arquivo inexistente por id invalido em download | `404` | `500` | Reprovado |
| Path traversal | Rejeicao controlada | Nao exercitavel manualmente via URL atual; endpoint e message-scoped, mas o comportamento observado com id invalido ja esta incorreto | Parcial |

## Erros encontrados

### 1. `pnpm db:migrate` nao e seguro/repetivel no banco local atual

Resultado observado:

- Drift detectado no `dev.db`
- Prisma solicitou reset destrutivo do banco local

Impacto:

- A etapa de inicializacao da RC nao fecha de forma repetivel
- O fluxo de validacao manual fica fragil

### 2. Inconsistencia de schema/runtime nas APIs de mensagens e extractions

Resultado observado em log:

- `The column main.WhatsappMessage.mimeType does not exist in the current database`
- `The table main.Extraction does not exist in the current database`

Impacto:

- `GET /api/whatsapp/messages` quebra com `500`
- `GET /api/extractions` quebra com `500`
- preview/download invalidos tambem retornam `500` em vez de `404`

### 3. `api/health` responde versao errada

Resultado observado:

```json
{"status":"ok","service":"finance-ai-dashboard","version":"0.0.1"}
```

Impacto:

- Saida operacional diverge da versao do repositorio (`0.0.9`)
- Healthcheck nao reflete corretamente a release candidate

### 4. `POST /api/whatsapp/connect` falhou

Impacto:

- Nao foi possivel validar QR code, conexao, reconexao e persistencia de sessao

## Observacoes

- O build e a suite automatizada estavam verdes anteriormente, mas a validacao manual local revelou problemas concretos de ambiente/runtime.
- Existe forte indicio de problema de resolucao do SQLite por caminho relativo entre workspace, pacote Prisma e runtime do Next.js.
- Tambem existe divergencia entre configuracao declarada e estado real, como `APP_VERSION=0.0.8` no `.env` e `version: 0.0.1` no healthcheck.

## Funcionalidades aprovadas

- `pnpm install`
- `pnpm db:generate`
- subida do app em `localhost:4000`
- resposta `200` das paginas principais
- `GET /api/pipeline/jobs`
- `GET /api/whatsapp/status`
- `POST /api/whatsapp/disconnect`

## Funcionalidades reprovadas

- `pnpm db:migrate` no banco local atual
- `GET /api/health` com versao coerente
- `GET /api/whatsapp/messages`
- `GET /api/extractions`
- `POST /api/whatsapp/connect`
- `GET /api/whatsapp/messages/[id]/preview` com tratamento correto para id invalido
- `GET /api/whatsapp/messages/[id]/download` com tratamento correto para id invalido

## Bugs encontrados

1. Drift/migracao local bloqueia `pnpm db:migrate` sem reset destrutivo.
2. Rotas de mensagens usam colunas que nao existem no banco efetivamente lido em runtime.
3. Rota de extractions usa tabela inexistente no banco efetivamente lido em runtime.
4. Healthcheck expone versao incorreta (`0.0.1`).
5. `connect` do WhatsApp falha no ambiente manual validado.
6. Preview/download com id invalido retornam `500` em vez de `404`.
7. Ha processos orfaos ocupando a porta `4000` em alguns reinicios do servidor.

## Melhorias sugeridas

1. Tornar o fluxo de migracao local deterministico, sem prompt interativo inesperado para a RC.
2. Corrigir a resolucao do caminho SQLite entre Prisma, package workspace e runtime do Next.js.
3. Garantir alinhamento entre `.env`, `README`, healthcheck e versao real publicada.
4. Endurecer preview/download para sempre responder `404` ou `400` controlado em ids invalidos.
5. Adicionar smoke test E2E minimo cobrindo `api/health`, `api/whatsapp/messages` e `api/extractions` em banco limpo.
6. Adicionar validacao operacional para detectar porta `4000` ocupada e encerramento limpo do dev server.

## Conclusao final

Esta release candidate **nao deve abrir a Epic 08 ainda** na validacao original (2026-06-24 manha).

### Revalidacao RC-01 (2026-06-24 tarde)

Apos correcoes documentadas em `docs/testing/rc-01-resolution.md`:

| Criterio | Status |
|---|---|
| `pnpm db:migrate` repetivel | Aprovado |
| `GET /api/health` versao `0.0.9` | Aprovado |
| `GET /api/whatsapp/messages` | Aprovado (`200`) |
| `GET /api/extractions` | Aprovado (`200`) |
| Preview/download id invalido | Aprovado (`404`) |
| `POST /api/whatsapp/connect` | Aprovado (`200`) |
| QR no dashboard / aparelho real | Pendente validacao manual |
| Reinicio preservando sessao | Pendente validacao manual |
| Fluxo ponta-a-ponta WhatsApp → Extraction | Pendente validacao manual |

**Veredito atualizado:** base tecnica apta para nova rodada de validacao manual completa; Epic 08 continua bloqueada ate confirmar WhatsApp real e pipeline com mensagens reais.

---

## Conclusao final (validacao original)

Esta release candidate **nao deve abrir a Epic 08 ainda**.

Antes disso, e necessario corrigir pelo menos:

1. o fluxo local de migracao
2. a resolucao do banco usada pelas APIs de mensagens/extractions
3. o healthcheck/versionamento exposto
4. o fluxo de conexao do WhatsApp
