@echo off
chcp 65001 >nul
cd /d "%~dp0"
title GATO · Instalacion (ejecutar una sola vez)
color 0B

echo.
echo  ============================================================
echo     GATO · INSTALACION DEL SERVIDOR  (solo la primera vez)
echo  ============================================================
echo.

REM --- 1) Comprobar Node.js -----------------------------------------------
echo  [1/4] Comprobando Node.js...
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo    ✗ No se encuentra Node.js en este equipo.
  echo.
  echo      Instalalo una vez desde:   https://nodejs.org
  echo      Elige la version "LTS", pulsa Siguiente / Next hasta el final.
  echo      Cuando termine, vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b
)
echo        OK
echo.

REM --- 2) Comprobar MariaDB ------------------------------------------------
echo  [2/4] Comprobando MariaDB...
where mysql >nul 2>nul
if errorlevel 1 (
  echo.
  echo    ✗ No se encuentra MariaDB en este equipo.
  echo.
  echo      Instalalo una vez desde:   https://mariadb.org/download/
  echo      Durante la instalacion:
  echo        - Anota la contrasena de "root" que te pida.
  echo        - Deja marcado "Install as service" (servicio de Windows).
  echo      Cuando termine, vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b
)
echo        OK
echo.

REM --- 3) Instalar dependencias del servidor (mysql2) ---------------------
echo  [3/4] Instalando componentes del servidor (necesita internet una vez)...
call npm install --omit=dev
if errorlevel 1 (
  echo.
  echo    ✗ No se pudieron instalar los componentes. Revisa tu conexion a internet.
  echo.
  pause
  exit /b
)
echo        OK
echo.

REM --- 4) Crear la base de datos y el usuario -----------------------------
echo  [4/4] Creando la base de datos "gato"...
echo.
echo        Se te pedira la contrasena de ROOT de MariaDB
echo        (la que anotaste al instalar MariaDB).
echo.
mysql -u root -p < crear-base-de-datos.sql
if errorlevel 1 (
  echo.
  echo    ✗ No se pudo crear la base de datos. Contrasena de root incorrecta?
  echo      Vuelve a intentarlo ejecutando de nuevo este archivo.
  echo.
  pause
  exit /b
)

echo.
echo  ============================================================
echo     ✓ INSTALACION COMPLETADA
echo  ============================================================
echo.
echo     Ya puedes arrancar el servidor con:
echo        INICIAR-GATO.bat
echo.
pause
