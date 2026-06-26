# Environment Configuration

Configuração centralizada em `packages/shared/src/config`.

## Objetivo

Toda variável de ambiente é validada com Zod e exposta por um único serviço tipado:

- `config.app`
- `config.database`
- `config.openai`
- `config.whatsapp`
- `config.storage`
- `config.logging`

Nenhum código fora dessa camada deve acessar `process.env` diretamente.

## Dados locais e `.gitignore`

Pastas de runtime **não são versionadas** (ver `.gitignore` na raiz):

| Path | Variável relacionada |
|------|---------------------|
| `storage/whatsapp/` | `WHATSAPP_SESSION_PATH` |
| `storage/media/` | `MEDIA_STORAGE_PATH` |
| `storage/temp/` | `TEMP_STORAGE_PATH` |
| `backups/` | `BACKUP_PATH` |
| `packages/database/prisma/dev.db` | `DATABASE_URL` |
| `.env` | Todas as secrets |

Somente `storage/.gitkeep` fica no repositório como marcador. Após clone: `cp .env.example .env` e `pnpm db:migrate`.

CI executa `pnpm validate:repo-hygiene` para impedir commit acidental de sessão, mídia ou banco.

## Startup Validation

- A aplicação valida a configuração no bootstrap.
- Falhas de configuração geram erro explícito e impedem a inicialização.
- Exemplo: `OPENAI_API_KEY` ausente em `development` ou `production` aborta o startup.

## OpenAI: processamento isolado

A OpenAI continua operando apenas como motor de extração estruturada.

Regras explícitas:

- não existe memória
- não existe histórico persistente
- não existe contexto entre mensagens
- não existe conversação contínua
- cada mensagem é processada como unidade independente

## Variáveis suportadas

| Variável | Descrição | Valor padrão | Obrigatória? | Impacto no sistema |
|----------|-----------|--------------|--------------|--------------------|
| `NODE_ENV` | Ambiente da aplicação | `development` | Não | Ajusta validação e comportamento de runtime |
| `PORT` | Porta HTTP principal | `4000` | Não | Define a porta do dashboard |
| `TZ` | Fuso horário padrão | `America/Sao_Paulo` | Não | Afeta timestamps e formatação temporal |
| `APP_NAME` | Nome da aplicação | `WhatsApp Assistant` | Não | Usado em identificação e documentação |
| `APP_VERSION` | Versão da aplicação | `0.0.8` | Não | Exposição da versão corrente |
| `DATABASE_URL` | String de conexão do banco | `file:./packages/database/prisma/dev.db` | Sim | Inicialização do Prisma e migrations |
| `OPENAI_API_KEY` | Chave da API OpenAI | `""` | Sim em dev/prod | Sem ela a camada de extração não inicializa |
| `OPENAI_MODEL` | Modelo padrão de extração | `gpt-5-mini` | Não | Define o motor de Structured Outputs |
| `OPENAI_TIMEOUT_MS` | Timeout da chamada OpenAI | `60000` | Não | Limita tempo de resposta da IA |
| `OPENAI_RETRY_ATTEMPTS` | Tentativas de retry | `3` | Não | Controla resiliência do provider |
| `OPENAI_RETRY_DELAY_MS` | Delay entre retries | `1000` | Não | Espaça novas tentativas |
| `WHATSAPP_SESSION_PATH` | Pasta da sessão Baileys | `./storage/whatsapp` | Não | Persistência local da sessão |
| `WHATSAPP_IGNORE_HISTORY` | Ignorar histórico antigo | `true` | Não | Mantém processamento focado em novas mensagens |
| `WHATSAPP_AUTO_RECONNECT` | Reconectar automaticamente | `true` | Não | Controla retomada da sessão |
| `WHATSAPP_RECONNECT_DELAY_MS` | Delay de reconexão | `5000` | Não | Evita reconnect agressivo |
| `MEDIA_STORAGE_PATH` | Pasta de mídias | `./storage/media` | Não | Destino futuro para anexos |
| `TEMP_STORAGE_PATH` | Pasta temporária | `./storage/temp` | Não | Arquivos transitórios |
| `COMPANY_NAME` | Nome da empresa | `Minha Empresa` | Não | Branding e contexto institucional |
| `DEFAULT_CURRENCY` | Moeda padrão | `BRL` | Não | Contexto monetário padrão |
| `LOG_LEVEL` | Nível de log | `info` | Não | Verbosidade do runtime |
| `LOG_PRETTY_PRINT` | Logs legíveis | `true` | Não | Formatação visual de logs |
| `AUDIT_ENABLED` | Ativa auditoria | `true` | Não | Habilita trilha de auditoria |
| `AUDIT_RETENTION_DAYS` | Retenção da auditoria | `3650` | Não | Janela de retenção |
| `BACKUP_ENABLED` | Ativa backups | `true` | Não | Controle de rotina de backup |
| `BACKUP_PATH` | Pasta de backups | `./backups` | Não | Destino dos backups |
| `CI` | Execução em CI | `false` | Não | Ajustes de infraestrutura e testes |
| `DOCKER_BUILD` | Build para container | `false` | Não | Permite `output: standalone` no Next |

## Exemplos de uso

```ts
import { config } from '@finance-ai/shared/config'

config.openai.model
config.database.url
config.whatsapp.sessionPath
config.logging.level
```
