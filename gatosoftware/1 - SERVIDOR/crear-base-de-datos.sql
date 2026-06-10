-- ============================================================================
--  GATO · Creación de la base de datos y el usuario en MariaDB / MySQL
--  ----------------------------------------------------------------------------
--  Lo ejecuta automáticamente el script  "INSTALAR (ejecutar una vez).bat".
--  Si lo prefieres a mano, abre una consola de MariaDB como root y pega esto.
--
--  Seguridad: el usuario 'gato' solo puede conectarse desde el PROPIO equipo
--  servidor (localhost). La base de datos NO queda expuesta a la red; solo el
--  backend de GATO (en este mismo equipo) le habla. Los equipos de la oficina
--  se conectan al backend por HTTP, nunca directamente a la base de datos.
--
--  >>> CAMBIA la contraseña 'gato' por una propia y ponla también en config.json
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `gato`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usuario solo-local (no accesible desde la red):
CREATE USER IF NOT EXISTS 'gato'@'localhost' IDENTIFIED BY 'gato';
CREATE USER IF NOT EXISTS 'gato'@'127.0.0.1' IDENTIFIED BY 'gato';

GRANT ALL PRIVILEGES ON `gato`.* TO 'gato'@'localhost';
GRANT ALL PRIVILEGES ON `gato`.* TO 'gato'@'127.0.0.1';

FLUSH PRIVILEGES;

-- Las TABLAS se crean solas la primera vez que arranca el servidor de GATO.
