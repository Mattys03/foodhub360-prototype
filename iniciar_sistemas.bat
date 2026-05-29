@echo off
title Central de Sistemas - FoodHub 360 & CampusFlow 360

:: Garante que o script roda a partir do seu próprio diretório de forma portátil
cd /d "%~dp0"

echo ============================================================
echo        INICIANDO ECOSSISTEMAS DIGITAIS (ADS PROTOTYPE)
echo ============================================================
echo.
echo [1/2] Abrindo Interface FoodHub 360 no seu navegador...
if exist "index.html" (
    start "" "index.html"
) else (
    echo [ERRO] Interface FoodHub 360 não encontrada!
)

echo [2/2] Abrindo Interface CampusFlow 360 no seu navegador...
if exist "..\campusflow360-prototype\index.html" (
    start "" "..\campusflow360-prototype\index.html"
) else (
    echo [AVISO] Pasta campusflow360-prototype não encontrada no nível anterior!
)
echo.
echo ============================================================
echo   SISTEMAS ABERTOS NO SEU NAVEGADOR!
echo ============================================================
echo.

:: Verifica se o Node.js está instalado para rodar a API REST
node -v >nul 2>&1
if %errorlevel% equ 0 (
    echo [!] Node.js detectado com sucesso!
    echo [!] Inicializando o Servidor de Estudos da API REST...
    
    if not exist node_modules (
        echo [!] Pasta node_modules não encontrada.
        echo [!] Instalando dependências locais - Express e CORS - necessárias...
        call npm install express cors --no-audit --no-fund
    )
    
    echo.
    echo ============================================================
    echo   SERVIDOR DE ESTUDOS ATIVO na Porta 3000
    echo   - Comunicando com os Protótipos dinamicamente
    echo   - Para encerrar o servidor, basta FECHAR esta janela!
    echo ============================================================
    echo.
    
    node server.js
) else (
    echo [AVISO] Node.js não foi encontrado no seu sistema.
    echo O Servidor de Estudos - API REST - não pôde ser iniciado.
    echo.
    echo [INFO] Não se preocupe! Os sistemas continuarão funcionando
    echo        perfeitamente usando armazenamento local - LocalStorage.
    echo.
    echo Pressione qualquer tecla para fechar esta janela...
    pause > nul
)
