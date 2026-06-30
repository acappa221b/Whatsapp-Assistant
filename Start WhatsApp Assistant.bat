@echo off
setlocal EnableExtensions
REM pushd maps UNC to a drive letter (Z:) - required for CMD/pnpm cwd
pushd "%~dp0"
set "ROOT=%CD%\"
set "WA_APP_ROOT=%CD%"
title WhatsApp Assistant Launcher

set "LOCAL_NODE=%ROOT%tools\node\node.exe"

REM local portable node already installed
if exist "%LOCAL_NODE%" (
  "%LOCAL_NODE%" -e "process.exit(Number(process.versions.node.split('.')[0])>=20?0:1)" >nul 2>&1
  if not errorlevel 1 (
    set "NODE_EXE=%LOCAL_NODE%"
    goto :run
  )
)

REM global node available, use it to prepare portable node
where node >nul 2>&1
if not errorlevel 1 (
  echo Preparing portable Node.js...
  for /f "delims=" %%N in ('node "%ROOT%scripts\ensure-node-path.mjs" 2^>nul') do set "NODE_EXE=%%N"
  if defined NODE_EXE goto :run
)

REM no node at all, use PowerShell fallback
echo.
echo ================================================================
echo First run - configuring Node.js automatically
echo ================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\bootstrap-node.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo Could not finish setup.
  echo Check logs\launcher.log for details.
  echo.
  pause
)
popd
exit /b %EXIT_CODE%

:run
set "WA_APP_ROOT=%CD%"
"%NODE_EXE%" "%ROOT%scripts\launch.mjs"
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo Launcher exited with error code %EXIT_CODE%.
  echo Check logs\launcher.log for details.
  echo.
)
pause
popd
exit /b %EXIT_CODE%
