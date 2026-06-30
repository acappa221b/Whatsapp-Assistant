$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$NodeVersion = "20.18.0"
$NodeDir = Join-Path $Root "tools\node"
$NodeExe = Join-Path $NodeDir "node.exe"
$LogDir = Join-Path $Root "logs"
$LogFile = Join-Path $LogDir "launcher.log"
$LaunchScript = Join-Path $Root "scripts\launch.mjs"

function Write-Log([string]$Message) {
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    $line = "[{0}] [bootstrap-ps1] {1}" -f (Get-Date -Format o), $Message
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
    Write-Host "==============================================================="
    Write-Host "First run - downloading Node.js $NodeVersion"
    Write-Host "==============================================================="
    Write-Host ""
    Write-Host "Please wait..."
    Write-Host ""

    Write-Log "Downloading $url"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    } catch {
        Write-Host ""
        Write-Host "ERROR: Could not download Node.js."
        Write-Host "Check internet connection and try again."
        Write-Host "Alternative: install Node.js 20+ from https://nodejs.org"
        Write-Host ""
        Write-Log ("Download failed: " + $_.Exception.Message)
        exit 1
    }

    if (Test-Path $extractRoot) { Remove-Item $extractRoot -Recurse -Force }
    if (Test-Path $NodeDir) { Remove-Item $NodeDir -Recurse -Force }

    Write-Host "Extracting files..."
    Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force

    $inner = Get-ChildItem -Path $extractRoot -Directory | Select-Object -First 1
    if (-not $inner) {
        Write-Host "ERROR: Unexpected Node package format."
        Write-Log "Unexpected package format"
        exit 1
    }

    New-Item -ItemType Directory -Path $NodeDir -Force | Out-Null
    Copy-Item -Path (Join-Path $inner.FullName "*") -Destination $NodeDir -Recurse -Force
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    Remove-Item $extractRoot -Recurse -Force -ErrorAction SilentlyContinue

    Write-Log "Node installed in $NodeDir"
    Write-Host ""
    Write-Host "Node.js installed successfully in tools\node"
    Write-Host ""
}

if (-not (Test-NodeOk $NodeExe)) {
    Install-PortableNode
}

if (-not (Test-NodeOk $NodeExe)) {
    Write-Host "ERROR: node.exe not found after installation."
    Write-Log "node.exe not found after install"
    exit 1
}

Write-Host "Starting WhatsApp Assistant..."
Write-Log "Running launch.mjs"
& $NodeExe $LaunchScript
exit $LASTEXITCODE
