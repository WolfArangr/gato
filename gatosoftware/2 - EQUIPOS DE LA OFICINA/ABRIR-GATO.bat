@echo off
chcp 65001 >nul

REM  ============================================================
REM   ABRIR GATO  ·  acceso para los equipos de la oficina
REM  ------------------------------------------------------------
REM   EDITA SOLO la linea de abajo y pon la IP del equipo SERVIDOR
REM   (la veras en la ventana negra del servidor, p. ej. 192.168.1.50)
REM  ============================================================

set SERVIDOR=192.168.1.50:8090

start "" "http://%SERVIDOR%"
