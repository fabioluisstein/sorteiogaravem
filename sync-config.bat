@echo off
chcp 65001 >nul
echo ================================
echo  SINCRONIZACAO DE CONFIGURACAO
echo  Sorteio Garagens Flor de Lis
echo ================================
echo.

if not exist "config\sorteio.properties" (
    echo ERRO: Arquivo config\sorteio.properties nao encontrado!
    pause
    exit /b 1
)

if not exist "public\" (
    echo Criando diretorio public...
    mkdir "public"
)

echo Verificando configuracoes...
echo.

for %%I in ("config\sorteio.properties") do (
    echo Origem: config\sorteio.properties
    echo Data: %%~tI
    echo Tamanho: %%~zI bytes
)
echo.

echo Sincronizando config\sorteio.properties para public\sorteio.properties...
copy "config\sorteio.properties" "public\sorteio.properties" /Y

if %errorlevel% equ 0 (
    echo.
    echo SUCESSO! Configuracao sincronizada.
    echo.
    
    fc /b "config\sorteio.properties" "public\sorteio.properties" >nul 2>&1
    if %errorlevel% equ 0 (
        echo Arquivos sao identicos - sincronizacao perfeita!
    ) else (
        echo Aviso: Diferencas detectadas nos arquivos!
    )
    
    echo.
    echo PROXIMOS PASSOS:
    echo 1. Recarregue o navegador (F5)
    echo 2. Verifique os logs no console
    echo 3. Teste o sorteio
    echo 4. Monitore comportamento esperado
) else (
    echo ERRO! Falha na sincronizacao (Codigo: %errorlevel%)
    echo.
    echo POSSIVEIS SOLUCOES:
    echo - Verifique se o arquivo nao esta em uso
    echo - Execute como Administrador
    echo - Feche o editor se estiver aberto
)

echo.
echo Configuracoes atuais sincronizadas!
echo Pressione qualquer tecla para continuar...
pause >nul