@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
cd /d "%~dp0"

title WhatsApp Assistant — Launcher

set "ROOT=%~dp0"
set "LOCAL_NODE=%ROOT%tools\node\node.exe"

REM --- Node portátil já instalado? ---
if exist "%LOCAL_NODE%" (
  "%LOCAL_NODE%" -e "process.exit(Number(process.versions.node.split('.')[0])>=20?0:1)" >nul 2>&1
  if not errorlevel 1 (
    set "NODE_EXE=%LOCAL_NODE%"
    goto :executar
  )
)

REM --- Node global disponível? Usa para baixar o portátil ---
where node >nul 2>&1
if not errorlevel 1 (
  echo Preparando Node.js portátil para este projeto...
  for /f "delims=" %%N in ('node "%ROOT%scripts\ensure-node-path.mjs" 2^>nul') do set "NODE_EXE=%%N"
  if defined NODE_EXE goto :executar
)

REM --- PC sem Node: PowerShell baixa tudo e inicia o app ---
echo.
echo ================================================================
echo   Primeira execucao — configurando Node.js automaticamente
echo ================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\bootstrap-node.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo Nao foi possivel concluir a configuracao.
  echo Veja logs\launcher.log para detalhes.
  echo.
  pause
)
exit /b %EXIT_CODE%

:executar
"%NODE_EXE%" "%ROOT%scripts\launch.mjs"
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo O launcher encerrou com erro (codigo %EXIT_CODE%^).
  echo Veja logs\launcher.log para mais detalhes.
  echo.
)
pause
exit /b %EXIT_CODE%
