# GATO · Gestión Asistida de Tareas de Oficina

Aplicación de gestión de eventos, clientes, reservas y facturación para una oficina, pensada para funcionar **en red local, sin nube y sin depender de internet**.

Los datos se guardan en una base de datos **MariaDB** dentro de la propia oficina; los equipos se conectan por el navegador.

![Panel de control de GATO](GATOMariaDB/docs/captura-inicio.png)

---

## ✨ Características

- **Multiusuario en red local** — varios equipos trabajando sobre los mismos datos en tiempo real.
- **Base de datos MariaDB** — robusta, con copias de seguridad automáticas.
- **Control de acceso por roles** — cada departamento ve solo lo que necesita.
- **PIN cifrado** (PBKDF2-SHA256) y bloqueo de cuenta tras varios intentos fallidos.
- **Cumplimiento RGPD** — registro de auditoría con verificación de integridad, copia cifrada (AES-256) e inventario de datos.
- **Modo local** — versión de un solo equipo, sin servidor, como respaldo o para trabajar sin red.
- **App de escritorio opcional** (.exe) mediante Tauri.

---

## 📸 Capturas

| Calendario y reservas | Clientes |
|---|---|
| ![Calendario](GATOMariaDB/docs/captura-calendario.png) | ![Clientes](GATOMariaDB/docs/captura-clientes.png) |

**Centro de seguridad y cumplimiento RGPD**

![Seguridad y RGPD](GATOMariaDB/docs/captura-rgpd.png)

---

## 🚀 Puesta en marcha rápida (modo servidor)

En el equipo que hará de servidor:

1. Instala **MariaDB** → <https://mariadb.org/download/> (anota la contraseña de `root`).
2. Instala **Node.js LTS** → <https://nodejs.org>.
3. Ejecuta `1 - SERVIDOR/INSTALAR (ejecutar una vez).bat`.
4. Ejecuta `1 - SERVIDOR/INICIAR-GATO.bat`.
5. Abre `http://localhost:8090` en el navegador.

Los demás equipos solo abren `http://IP-DEL-SERVIDOR:8090`. No instalan nada.

> La guía detallada paso a paso está en `GUÍA DE INSTALACIÓN (paso a paso).html`.

---

## 📁 Estructura

| Carpeta | Para qué sirve |
|---|---|
| `1 - SERVIDOR/` | Servidor de datos (Node.js + MariaDB) y la app que se sirve. |
| `2 - EQUIPOS DE LA OFICINA/` | Acceso rápido para los demás PC. |
| `3 - APP LOCAL/` | Versión de un solo equipo, sin servidor. |
| `HERRAMIENTAS/` | Restablecer el PIN del administrador. |
| `gato/` | Código fuente de la aplicación (módulos JS/JSX). |
| `GATO.html` | Archivo de desarrollo desde el que se generan los paquetes. |

---

## 🛠 Tecnología

- **Frontend:** HTML + React (sin build; se transpila en el navegador).
- **Backend:** Node.js (sin frameworks pesados) + conector `mysql2`.
- **Base de datos:** MariaDB / MySQL.
- **Escritorio (opcional):** Tauri.

---

## 🔒 Privacidad

Todos los datos permanecen en la oficina. La base de datos solo escucha en el propio equipo servidor (no se expone a la red) y nada se envía a internet.

---

## 📄 Licencia

Software privado. Todos los derechos reservados.
