@echo off
setlocal enabledelayedexpansion

:menu
cls
echo ╔══════════════════════════════════════════╗
echo ║  SINCRONIZAÇÃO DE CONFIGURAÇÕES  ║
echo ║  Sorteio Garagens Flor de Lis  ║
echo ╚══════════════════════════════════════════╝
echo.
echo Escolha uma opção:
echo.
echo [1] 🔄 Sincronização Manual (uma vez)
echo [2] ⚡ Sincronização Automática (contínua)
echo [3] ✅ Verificar Status dos Arquivos
echo [4] 🧹 Limpar Arquivos Sincronizados
echo [5] ❌ Sair
echo.
set /p choice="Digite sua escolha (1-5): "

if "%choice%"=="1" goto manual_sync
if "%choice%"=="2" goto auto_sync
if "%choice%"=="3" goto check_status
if "%choice%"=="4" goto clean_files
if "%choice%"=="5" goto exit
goto menu

:manual_sync
echo.
echo 🔄 SINCRONIZAÇÃO MANUAL
echo ═══════════════════════
echo.

if not exist "config\sorteio.properties" (
  echo ❌ ERRO: config\sorteio.properties não encontrado!
  goto pause_return
)

if not exist "public\" mkdir "public"

echo 📋 Informações do arquivo de origem:
for %%I in ("config\sorteio.properties") do (
  echo  📁 Arquivo: config\sorteio.properties
  echo  📅 Data: %%~tI
  echo  📏 Tamanho: %%~zI bytes
)
echo.

echo 🔄 Sincronizando...
copy "config\sorteio.properties" "public\sorteio.properties" /Y >nul

if %errorlevel% equ 0 (
  echo ✅ Sincronização concluída com sucesso!
  
  fc /b "config\sorteio.properties" "public\sorteio.properties" >nul 2>&1
  if %errorlevel% equ 0 (
    echo ✅ Verificação: Arquivos são idênticos!
    ) else (
    echo ⚠️  Aviso: Diferenças detectadas!
  )
  ) else (
  echo ❌ Erro na sincronização! (Código: %errorlevel%)
)

goto pause_return

:auto_sync
echo.
echo ⚡ SINCRONIZAÇÃO AUTOMÁTICA
echo ═══════════════════════════
echo.
echo Iniciando monitoramento automático...
echo.
echo 📋 INSTRUÇÕES:
echo • As configurações serão sincronizadas automaticamente
echo • Pressione Ctrl+C para parar o monitoramento
echo • Deixe esta janela aberta enquanto desenvolve
echo.
echo Pressione qualquer tecla para iniciar...
pause >nul

echo.
echo 🔄 Iniciando auto-sync...
npm run dev:watch
goto menu

:check_status
echo.
echo ✅ STATUS DOS ARQUIVOS
echo ═══════════════════════
echo.

if exist "config\sorteio.properties" (
  echo ✅ config\sorteio.properties - EXISTE
  for %%I in ("config\sorteio.properties") do (
    echo  📅 Data: %%~tI
    echo  📏 Tamanho: %%~zI bytes
  )
  ) else (
  echo ❌ config\sorteio.properties - NÃO ENCONTRADO
)

echo.

if exist "public\sorteio.properties" (
  echo ✅ public\sorteio.properties - EXISTE
  for %%I in ("public\sorteio.properties") do (
    echo  📅 Data: %%~tI
    echo  📏 Tamanho: %%~zI bytes
  )
  ) else (
  echo ❌ public\sorteio.properties - NÃO ENCONTRADO
)

echo.

if exist "config\sorteio.properties" if exist "public\sorteio.properties" (
  echo 🔍 Verificando se os arquivos são idênticos...
  fc /b "config\sorteio.properties" "public\sorteio.properties" >nul 2>&1
  if %errorlevel% equ 0 (
    echo ✅ RESULTADO: Arquivos são IDÊNTICOS
    ) else (
    echo ⚠️  RESULTADO: Arquivos são DIFERENTES - sincronização necessária!
  )
)

goto pause_return

:clean_files
echo.
echo 🧹 LIMPEZA DE ARQUIVOS
echo ═══════════════════════
echo.
echo ⚠️  Esta ação irá remover o arquivo public\sorteio.properties
echo.
set /p confirm="Tem certeza? (s/N): "

if /i "%confirm%"=="s" (
  if exist "public\sorteio.properties" (
    del "public\sorteio.properties" >nul 2>&1
    if %errorlevel% equ 0 (
      echo ✅ Arquivo removido com sucesso!
      ) else (
      echo ❌ Erro ao remover arquivo!
    )
    ) else (
    echo 📋 Arquivo não existe - nada para limpar.
  )
  ) else (
  echo 📋 Operação cancelada.
)

goto pause_return

:pause_return
echo.
echo Pressione qualquer tecla para voltar ao menu...
pause >nul
goto menu

:exit
echo.
echo 👋 Obrigado por usar o sincronizador!
echo.
exit /b 0
