@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if errorlevel 1 (
    echo Python nao foi encontrado.
    echo Instale o Python 3.11 ou superior em https://www.python.org/downloads/
    echo Durante a instalacao, marque a opcao "Add Python to PATH".
    pause
    exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
    echo Criando um ambiente Python isolado para a aplicacao...
    py -m venv .venv
    if errorlevel 1 (
        echo.
        echo Nao foi possivel criar o ambiente Python local.
        pause
        exit /b 1
    )
)

set "PYTHON_LOCAL=%CD%\.venv\Scripts\python.exe"

echo Preparando e atualizando a aplicacao web local...
"%PYTHON_LOCAL%" -m pip install --upgrade pip setuptools wheel
if errorlevel 1 (
    echo.
    echo Nao foi possivel atualizar o instalador do Python.
    echo Verifique a conexao com a internet e tente novamente.
    pause
    exit /b 1
)

"%PYTHON_LOCAL%" -m pip install --upgrade --upgrade-strategy eager -r requirements.txt
if errorlevel 1 (
    echo.
    echo Nao foi possivel instalar as dependencias.
    echo Verifique a conexao com a internet e tente novamente.
    pause
    exit /b 1
)

echo.
echo Abrindo o dashboard Performance Analytics em modo demonstracao...
"%PYTHON_LOCAL%" servidor_html.py

pause
endlocal
