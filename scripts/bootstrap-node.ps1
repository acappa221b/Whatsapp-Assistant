# Bootstrap Node.js portátil no Windows (sem Node pré-instalado)
# Uso: powershell -ExecutionPolicy Bypass -File scripts\bootstrap-node.ps1

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$NodeVersion = "20.18.0"
$NodeDir = Join-Path $Root "tools\node"
$NodeExe = Join-Path $NodeDir "node.exe"
$LogDir = Join-Path $Root "logs"
$LogFile = Join-Path $LogDir "launcher.log"

function Write-Log([string]$Message) {
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
    $line = "[$(Get-Date -Format o)] [bootstrap-ps1] $Message"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Test-NodeOk([string]$Exe) {
    if (-not (Test-Path $Exe)) { return $false }
    try {
        $ver = & $Exe -p "process.versions.node" 2>$null
        $major = [int]($ver -split '\.')[0]
        return $major -ge 20
    } catch {
        return $false
    }
}

function Install-PortableNode {
    $zipName = "node-v$NodeVersion-win-x64.zip"
    $url = "https://nodejs.org/dist/v$NodeVersion/$zipName"
    $zipPath = Join-Path $env:TEMP "whatsapp-assistant-node.zip"
    $extractRoot = Join-Path $env:TEMP "whatsapp-assistant-node-extract"

    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  Primeira execucao — baixando Node.js $NodeVersion" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Aguarde. Isso pode levar alguns minutos dependendo da internet..."
    Write-Host ""

    Write-Log "Baixando $url"

    try {
        $ProgressPreference = "Continue"
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    } catch {
        Write-Host ""
        Write-Host "ERRO: Nao foi possivel baixar o Node.js." -ForegroundColor Red
        Write-Host "Verifique sua conexao com a internet e tente novamente." -ForegroundColor Yellow
        Write-Host "Alternativa: instale Node.js 20+ em https://nodejs.org" -ForegroundColor Yellow
        Write-Host ""
        Write-Log "Falha download: $_"
        exit 1
    }

    if (Test-Path $extractRoot) { Remove-Item $extractRoot -Recurse -Force }
    if (Test-Path $NodeDir) { Remove-Item $NodeDir -Recurse -Force }

    Write-Host "Extraindo arquivos..."
    Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force

    $inner = Get-ChildItem -Path $extractRoot -Directory | Select-Object -First 1
    if (-not $inner) {
        Write-Host "ERRO: Pacote Node em formato inesperado." -ForegroundColor Red
        exit 1
    }

    New-Item -ItemType Directory -Path $NodeDir -Force | Out-Null
    Copy-Item -Path (Join-Path $inner.FullName "*") -Destination $NodeDir -Recurse -Force

    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    Remove-Item $extractRoot -Recurse -Force -ErrorAction SilentlyContinue

    Write-Log "Node instalado em $NodeDir"
    Write-Host ""
    Write-Host "Node.js instalado com sucesso em tools\node\" -ForegroundColor Green
    Write-Host ""
}

if (-not (Test-NodeOk $NodeExe)) {
    Install-PortableNode
}

if (-not (Test-NodeOk $NodeExe)) {
    Write-Host "ERRO: node.exe nao encontrado apos instalacao." -ForegroundColor Red
    exit 1
}

$LaunchScript = Join-Path $Root "scripts\launch.mjs"
Write-Host "Iniciando WhatsApp Assistant..."
Write-Log "Executando $NodeExe $LaunchScript"

& $NodeExe $LaunchScript
exit $LASTEXITCODE
