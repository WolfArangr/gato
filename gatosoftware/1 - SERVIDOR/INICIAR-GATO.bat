@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Servidor GATO · NO CERRAR esta ventana

REM Arranca el servidor de GATO y, si por cualquier motivo se detuviera,
REM lo vuelve a levantar automaticamente (mayor fiabilidad).

:loop
cls
echo.
echo  ============================================================
echo     SERVIDOR GATO  ·  EN MARCHA
echo  ============================================================
echo.
echo     NO CIERRES esta ventana mientras se use GATO.
echo     Para apagar el servidor: cierra esta ventana.
echo.
echo  ------------------------------------------------------------
echo.

node server.js

echo.
echo  ------------------------------------------------------------
echo     El servidor se detuvo. Se reiniciara en 5 segundos.
echo     (Pulsa Ctrl + C para salir definitivamente.)
echo  ------------------------------------------------------------
timeout /t 5 /nobreak >nul
goto loop
