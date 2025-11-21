@echo off
setlocal enabledelayedexpansion
title Sorteio Garagens - Auto Deploy
cls

echo.
echo ████████████████████████████████████████████
echo  SORTEIO GARAGENS - AUTO DEPLOY v1.0
echo ████████████████████████████████████████████
echo.

:: Verifica se está no diretório correto
if not exist "config\sorteio.properties" (
  echo ❌ ERRO: Execute este script na pasta raiz do projeto!
  echo  Pasta atual: %CD%
  echo  Deveria conter: config\sorteio.properties
  echo.
  pause
  exit /b 1
)

echo [ETAPA 1/4] 🔍 Verificando alterações...
fc /B "config\sorteio.properties" "public\sorteio.properties" > nul 2>&1
if %errorlevel% neq 0 (
  echo ✅ Alterações detectadas em config/sorteio.properties
  set SYNC_NEEDED=1
  ) else (
  echo ℹ️  Nenhuma alteração detectada
  set SYNC_NEEDED=0
)

echo.
echo [ETAPA 2/4] 🔄 Sincronizando configurações...
copy "config\sorteio.properties" "public\sorteio.properties" /Y > nul
if %errorlevel% equ 0 (
  echo ✅ Configuração sincronizada: config → public
  ) else (
  echo ❌ ERRO na sincronização!
  pause
  exit /b 1
)

echo.
echo [ETAPA 3/4] 🛑 Parando serviços existentes...
:: Para processos do Vite que possam estar rodando
tasklist /FI "IMAGENAME eq node.exe" | find "node.exe" > nul
if %errorlevel% equ 0 (
  echo ⏹️  Parando processos Node.js existentes...
  taskkill /F /IM node.exe > nul 2>&1
  timeout /t 2 /nobreak > nul
)

echo.
echo [ETAPA 4/4] 🚀 Iniciando aplicação...
echo ➡️  Executando: npm run dev
echo ➡️  URL: http://localhost:5173/
echo.
echo ═══════════════════════════════════════════════
echo  APLICAÇÃO INICIANDO... (Ctrl+C para parar)
echo ═══════════════════════════════════════════════
echo.

:: Inicia o servidor de desenvolvimento
npm run dev

:: Se o npm run dev for interrompido
echo.
echo ⏹️  Aplicação finalizada.
pause
