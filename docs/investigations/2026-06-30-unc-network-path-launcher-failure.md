# Investigação — Falha do launcher em caminho UNC de rede

**Data:** 2026-06-30  
**RC:** RC-21  
**Versão corrigida:** 1.5.3-rc21

## Sintomas

Usuário abriu `Start WhatsApp Assistant.bat` em:

```
\\SERVER\Comercial\Whatsapp-Assistant-main
```

Erro reportado:

```
ERR_PNPM_NO_PKG_MANIFEST No package.json found in C:\Windows
```

## Causa raiz

1. O `.bat` usava `cd /d "%~dp0"`, que **não funciona** com caminhos UNC no CMD.
2. Sem `cd` válido, o diretório atual permaneceu `C:\Windows`.
3. `launch.mjs` derivava `ROOT` de `import.meta.url` (correto em Node), mas `spawn(..., { cwd: ROOT, shell: true })` no Windows não aceita UNC como `cwd` quando o shell é CMD.
4. Com `shell: true`, o pnpm herdava `C:\Windows` como cwd.

## Correção

| Camada | Ação |
|--------|------|
| `.bat` | `pushd "%~dp0"` mapeia UNC → `Z:\...`; `set WA_APP_ROOT=%CD%` |
| Node | `resolveAppRoot()` lê `WA_APP_ROOT` com prioridade |
| spawn | `shell: false` para `pnpm.cmd` / `corepack.cmd` |
| auto-update | Skip em UNC não mapeado |

## Reprodução manual (pós-fix)

1. Copiar ou clonar o projeto para `\\server\share\WhatsApp-Assistant`
2. Duplo-clique em `Start WhatsApp Assistant.bat`
3. Verificar `logs/launcher.log`:
   - `App root: Z:\...` (não `C:\Windows`)
4. Confirmar `pnpm install` e `/api/health` 200

## Instalação local (controle)

1. Executar o `.bat` em `C:\Dev\...` — deve continuar funcionando
2. `App root:` deve mostrar caminho local sem `(UNC)`

## Se ainda falhar

- Mapear unidade: `net use W: \\SERVER\share\pasta`
- Copiar para disco local (recomendado para produção)
- Ver **Configurações → Logs** (source `launcher`)
