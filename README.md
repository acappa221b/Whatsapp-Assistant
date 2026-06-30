# WhatsApp Assistant

**Versão:** 1.7.0-rc25  
**Fase:** RC-25 chat sort, dashboard IA costs, audio gate, multi-message  
**Porta padrão:** [http://localhost:4000](http://localhost:4000)

Assistente de memória conversacional via WhatsApp — captura, organização, indexação e transcrição de conversas para histórico de longo prazo.

> **Pivot de produto (2025-06-25):** este repositório deixa de ser *Finance AI Dashboard*. Ver [ADR-009](docs/adr/009-product-pivot-whatsapp-assistant.md).

---

## Objetivo

- Capturar **todas** as mensagens, chats, grupos e usuários
- Transcrever **todos** os áudios (Whisper)
- Exibir arquivo consultável (Mensagens)
- Sumário com métricas (Dashboard)
- Retenção 60 dias (mensagens); relatórios permanentes (Fase 2)
- **IA conversacional (RC-10):** resposta automática OpenAI; **RC-10B:** skip em acks, anti-repetição, sem convites

---

## Documentação principal

| Documento | Descrição |
|-----------|-----------|
| [Visão do produto](docs/product/vision.md) | Objetivos e métricas |
| [Arquitetura Assistant](docs/architecture/assistant-overview.md) | Diagrama e camadas |
| [Plano de migração](docs/refactor/migration-plan.md) | Fases 0–4 |
| [Módulos deprecated](docs/refactor/deprecated-modules.md) | O que será removido |
| [Epic Assistant-01](specs/epic-assistant-01/README.md) | Spec implementação |
| [Whisper / Transcrição](docs/whisper/transcription.md) | Pipeline áudio |
| [Roadmap](ROADMAP.md) | Marcos do produto |

---

## Menu (aplicação)

| Rota | Nome |
|------|------|
| `/dashboard/permissions` | **Permissões** (governança por chat) |
| `/dashboard/assistant` | **Chat IA** (relatórios + ações) |
| `/dashboard` | Sumário |
| `/dashboard/messages` | Mensagens (somente chats com `archiveEnabled`) |
| `/dashboard/multi-mensagem` | **Multi Mensagem** (envio em massa para chats habilitados) |
| `/dashboard/reports` | Relatórios diários |
| `/dashboard/settings` | **Configurações** (geral, provedores IA, **IA**, WhatsApp, relatórios, **Logs**) |

Redirect: `/` → `/dashboard` · `/dashboard/chats` → `/dashboard/permissions` · `/dashboard/whatsapp` → `/dashboard/settings?tab=whatsapp`

---

## Dados locais (não versionados)

Estes paths existem apenas na máquina de desenvolvimento — **nunca** entram no Git:

| Path | Conteúdo |
|------|----------|
| `storage/whatsapp/` | Sessão Baileys (`creds.json`, keys, sessions) |
| `storage/media/` | Fotos, áudios e relatórios por chat |
| `storage/temp/` | Arquivos temporários |
| `storage/training/` | Documentos de treinamento IA (uploads) |
| `packages/database/prisma/dev.db` | Banco SQLite com mensagens |
| `backups/` | Backups locais |
| `logs/` | Logs do launcher |

Após clone: execute o launcher (abaixo) — migrations rodam automaticamente.

Validação: `pnpm validate:repo-hygiene` (também roda no CI).

### Governança por chat (RC-08B)

| Switch | Campo | Efeito (RC-12) |
|--------|-------|----------------|
| **Habilitado** | `archiveEnabled` | Chat visível em Mensagens |
| **Resposta IA** | `agentChatEnabled` | Agent TEXT + áudio/imagem pós-processamento |
| **Áudio** | `audioProcessingEnabled` | Transcrição Whisper → `[ÁUDIO]` no content; bolha só após transcrição (RC-25) |
| **Foto** | `photoProcessingEnabled` | Vision + agent com contexto `[FOTO]` |
| **Relatório** | `reportGenerationEnabled` | Geração manual/auto de relatórios |
| **#N** | `displayNumber` | ID estável do chat em Permissões e Mensagens |
| **Lixeira** | — | Apaga mensagens + mídia; desabilita flags; chat permanece em Permissões |

A captura Baileys **não** é filtrada por Habilitado — mensagens continuam no banco; só a visualização e IA são governadas.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, Recharts |
| Backend | Next.js Route Handlers |
| Banco | Prisma ORM, SQLite (MVP) → PostgreSQL |
| WhatsApp | Baileys |
| Transcrição | OpenAI Whisper |
| Testes | Vitest, Playwright, Harnesses |

### Banco de dados (dev)

Após pull com mudanças em `schema.prisma`:

```bash
pnpm db:migrate && pnpm db:generate
```

Reinicie o dev server após `db:generate`. Se `db:generate` falhar com `EPERM`, pare o `pnpm dev` primeiro (o engine Prisma fica bloqueado). Ver [prisma-fromme-client-desync](docs/investigations/prisma-fromme-client-desync.md).

---

## Governança SDD

- Specs em `specs/epic-assistant-01/`
- Harnesses em `harness/epic-assistant-01/`
- ADRs em `docs/adr/`
- **Regra:** 1 feature · 1 epic · 1 validação por vez

```bash
pnpm harness   # inclui Assistant01SpecHarness + PlanningHarness
```

---

## Estrutura de pastas

```
apps/dashboard/              # Next.js (UI + API)
packages/
  whatsapp/                  # Baileys ingest
  core/                      # Domínios (assistant + deprecated finance)
  database/                  # Prisma
  shared/                    # Config (APP_NAME → WhatsApp Assistant)
  ai/                        # Whisper (Fase 1); OCR financeiro DEPRECATED
specs/
  epic-assistant-01/         # Spec ATIVA
  epic-XX/                   # Legado DEPRECATED
docs/
  product/ refactor/ whisper/ architecture/
harness/
  epic-assistant-01/
```

---

## Legado Finance AI (DEPRECATED)

Módulos financeiros **não removidos ainda** — marcados deprecated:

Expense, Revenue, Category, Supplier, Pipeline, Extrações, Aprovações, Excel, OCR financeiro.

Detalhes: [docs/refactor/deprecated-modules.md](docs/refactor/deprecated-modules.md)

---

## Começar em 2 minutos (Windows / Mac / Linux)

1. Clone o repositório
2. Execute o launcher na pasta do projeto:
   - **Windows:** duplo-clique em `Start WhatsApp Assistant.bat` — **nao precisa instalar Node manualmente**; na primeira execucao o launcher baixa Node.js 20 LTS para `tools/node/` (somente neste PC)
   - **macOS:** duplo-clique em `Start WhatsApp Assistant.command` (instale [Node.js 20+](https://nodejs.org) antes)
   - **Terminal:** `pnpm launch` ou `node scripts/launch.mjs` (requer Node 20+ no PATH)
3. O navegador abrirá em [http://localhost:4000](http://localhost:4000)
4. Em **Configurações**, adicione sua chave de IA
5. Em **WhatsApp**, escaneie o QR Code
6. Em **Permissões**, habilite os chats desejados

### Windows sem Node instalado

Duplo-clique no `.bat` -> download automatico do Node portatil -> instalacao de dependencias -> browser em `:4000`. A segunda execucao reutiliza `tools/node/` sem baixar de novo.

Em PCs corporativos, antivirus, proxy ou firewall podem atrasar o download inicial do Node.js. Se o launcher falhar, verifique `logs/launcher.log`.

### Executando de pasta de rede (UNC)

A partir da **RC-21**, o launcher suporta abrir o `.bat` diretamente em caminhos de rede, por exemplo `\\servidor\Comercial\Whatsapp-Assistant`. O `pushd` mapeia o UNC para uma letra de unidade temporária automaticamente.

**Recomendado para produção:** copie o projeto para disco local (`C:\Users\...\WhatsApp-Assistant`). Rede pode ser lenta; SQLite e `node_modules` em UNC são menos estáveis.

**Se ainda falhar:**

1. Mapeie uma unidade manualmente: `net use W: \\SERVER\share\pasta`
2. Abra **Configurações → Logs** e filtre erros com source **launcher**
3. Exporte `.txt` para suporte

### O que fica só no seu computador

- `tools/node/` — Node.js portátil (Windows, bootstrap automático)
- `storage/` — sessão WhatsApp e mídias
- `packages/database/prisma/dev.db` — mensagens e relatórios
- `backups/`

Nada disso vai para o GitHub.

---

## Desenvolvimento (contribuidores)

```bash
pnpm install
pnpm db:migrate && pnpm db:generate
pnpm dev
```

Abrir [http://localhost:4000/dashboard/settings?tab=whatsapp](http://localhost:4000/dashboard/settings?tab=whatsapp) para conectar.

Ver [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Como atualizar

Atualizar e facil: **feche o programa e abra de novo** `Start WhatsApp Assistant.bat`.

Se houver versao nova, o programa pergunta se quer atualizar. Seus chats e configuracoes **nao sao apagados**.

| Como instalou | O que acontece |
|---------------|----------------|
| ZIP do GitHub | Baixa e aplica automaticamente (overlay) |
| Clone Git | `git pull` automatico |
| Sem internet | Abre na versao atual |

### Dados preservados

- `storage/` (WhatsApp, midias)
- Banco de dados local (configuracoes, mensagens, API keys)
- `tools/node/` (Node portatil)
- `logs/`

### Modo profissional

| Variavel | Efeito |
|----------|--------|
| `WA_SKIP_UPDATE=1` | Pular checagem |
| `WA_UPDATE_SILENT=1` | Atualizar sem perguntar |
| `WA_UPDATE_AUTO=1` | Assumir sim no prompt |

Logs: `logs/launcher.log`, `logs/update.log`

### Formato de versão

`MAJOR.MINOR.PATCH-rcNN[sufixo]` — exemplos: `1.6.1-rc18b`, `1.6.2-rc24`, `1.6.1` (release estável).

A versao instalada aparece em **Configuracoes → Geral → Sobre** e no topo do dashboard. Novas versoes geram um banner com instrucoes.

### Ver logs e pedir ajuda (RC-20)

1. Abra **Configurações → Logs**
2. Se algo falhou, use **Somente erros**
3. Clique **Exportar .txt** e envie o arquivo para quem está te ajudando
4. Logs do `Start WhatsApp Assistant.bat` aparecem com etiqueta **launcher**

### Sync de chats (RC-22A)

Por padrão, **grupos e agenda não sincronizam** automaticamente. Chats entram em Permissões quando há mensagem recebida ou enviada.

- **Configurações → WhatsApp → Sincronização** — toggles para reativar sync legado
- **Permissões → Limpar chats sem mensagem** — remove centenas de entradas órfãs de sync antigo
- Filtro **Com mensagem** (default) oculta configs sem histórico

### Transcrição de áudio (RC-23 / RC-25)

Requer **OpenAI Whisper** — em **Configurações → Provedores IA → Provedor por função → Transcrição áudio**, selecione um provedor OpenAI (Gemini não transcreve áudio).

- Áudios novos são transcritos automaticamente quando **Áudio** está habilitado em Permissões
- **RC-25:** com Áudio habilitado, o áudio só aparece no chat após a transcrição (OpenAI Whisper)
- Se falhar, a bolha mostra erro amigável e **Tentar novamente**
- Ao habilitar Áudio em um chat, áudios recentes pendentes são reprocessados

### Mensagens (RC-25)

A lista de chats segue a ordem da última mensagem (mais recente no topo), como no WhatsApp.

### Multi Mensagem (RC-25)

Selecione chats habilitados e envie a mesma mensagem para todos. Há intervalo de ~2s entre envios para segurança (máx. 50 chats).

---

## Próximo passo

**RC-25** entrega ordenação de chats, custos Chat IA no dashboard, gate de áudio Whisper e envio Multi Mensagem.

---

## Limitações atuais

- Busca na KB por palavras-chave (sem embeddings/pgvector na v1)
- Persona global apenas (override por chat = v1.1)
- DELETE histórico não remove embeddings/RAG (futuro)
- Sem autenticação multi-usuário

---

## Histórico de versões (README)

| Versão | Descrição |
|--------|-----------|
| 1.7.0-rc25 | RC-25: sort chats por recência, tooltip custo tokens, custos Chat IA, gate áudio Whisper, Multi Mensagem |
| 1.6.2-rc24 | RC-24: parse versao rc18b, fim banner falso de update, cache localVersion |
| 1.6.1-rc23 | RC-23: transcrição áudio Whisper-only, retry/backfill, UI erro/retry |
| 1.6.1-rc18b | RC-18B: auto-update ZIP overlay + Git no launcher, dados preservados, banner/Sobre |
| 1.6.0-rc22 | RC-22A: sync message-driven, sem grupos/agenda auto, prune orfaos, permissoes paginadas |
| 1.5.3-rc21 | RC-21: suporte UNC no launcher Windows (pushd, WA_APP_ROOT, shell fix pnpm) |
| 1.5.2-rc20 | RC-20: aba Logs em Configurações, logging centralizado, export .txt, filtro erros, launcher merge |
| 1.5.1-rc19 | RC-19: bolha [Áudio] com transcrição, feedback salvamento API keys, edição PATCH provedores |
| 1.5.0-rc18 | RC-18: version.json SSOT, barra de versao no topo, check GitHub, auto-update no launcher |
| 1.5.0-rc17 | RC-17: aba IA (persona, KB excel/texto/imagem, simulador), ComposeAgentPrompt, integração auto-reply + Chat IA |
| 1.4.2-rc16 | RC-16: sync chats ao conectar, diagnostics WhatsApp, fix messages.upsert type, banners iPhone/linked device |
| 1.4.1-rc15 | RC-15: scroll dashboard, custos estimados, sort #N, WhatsApp em Configuracoes, fix agent multimidia e Chat IA |
| 1.4.0-rc14 | RC-14: mensagens estilo WhatsApp, zero `.env`, launcher, config no dashboard |
| 1.3.1-rc13 | RC-13: permissões ordenáveis, Chat IA operacional (preview/send) |
| 1.1.1-rc10b | RC-10B: skip ack/status, anti-repetição, anti-convite na resposta IA |
| 1.1.0-rc10 | RC-10: `#N` por chat, Resposta IA (OpenAI), `sendMessage` Baileys, takeover/deferral |
| 1.0.9-rc09 | RC-09: nomes confiáveis, mídia por chat, delete recursivo, reset geral |
| 1.0.8-rc08b | RC-08B: Permissões, `archiveEnabled`, DELETE histórico, filtro Mensagens |
| 1.0.7-rc07f | RC-07F: unwrapper Baileys, ChatIdentityResolver, archive/health, repair histórico |
| 1.0.6-rc06f | RC-06F: message fidelity, ChatContactResolver, /api/whatsapp/fidelity, diagnostics |
| 1.0.5-rc07 | RC-07: Baileys reconnect fix, name bootstrap, message previews |
| 1.0.4-rc06 | RC-06: display names (ContactNameResolver, backfill, UI sem JIDs) |
| 1.0.3-rc05 | RC-05: runtime refresh, archive/chats fix, chatId filter, UI error states |
| 1.0.2-rc04 | RC-04 Message Archive: classificador, rawPayload, métricas, UI 2 colunas |
| 1.0.1-assistant-01a | Rebranding UI: sidebar neon, Sumário, menu 4 itens, redirect |
| 1.0.0-planning | Pivot WhatsApp Assistant — docs + spec Assistant-01 |
| 0.0.13 | RC-03 WhatsApp runtime (legado Finance AI) |
| 0.0.x | Epics financeiras (deprecated) |
