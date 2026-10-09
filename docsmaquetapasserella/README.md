# Passerella · maqueta para GitHub

Estructura:
- `index.html` (raíz, obligatorio para GitHub Pages) y `.nojekyll`.
- `docsmaquetapasserella/`: todas las imágenes y el resto de archivos (páginas legales, 404, sitemap, robots, llms, manifest, og-image).

Nota: GitHub Pages y los buscadores solo leen `404.html`, `robots.txt` y `sitemap.xml` en la raíz. Al publicar en el dominio definitivo, muévelos a la raíz.


Sitio estático (HTML + CSS + JS, sin dependencias ni build) listo para GitHub Pages.

## Publicar en GitHub Pages
1. Sube el contenido de esta carpeta a la raíz de un repositorio.
2. Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)`.
3. Configura el dominio propio en Settings → Pages → *Custom domain* (se creará el archivo `CNAME`).

> Cada `.html` es autocontenido: estilos, scripts, fuentes e imágenes van incrustados. Funciona igual en `usuario.github.io/repositorio/` que en un dominio propio (la 404 detecta la subcarpeta de GitHub Pages).

## Antes de publicar
- Sustituye `https://passerellamallorca.com` por el dominio real en: todos los `.html` (canonical, og), `sitemap.xml`, `robots.txt`, `llms.txt` / `llm.txt`.
- Completa los datos marcados entre corchetes en `aviso-legal.html` y `privacidad.html` (titular, NIF, dirección, email).
- Revisa el horario orientativo de reservas (10:00–13:30 y 16:00–19:30, lunes a sábado) en `index.html` y `assets/js/main.js` (`OPEN_SUNDAYS`).

## Estructura
```
index.html            Página principal (carta, método, club, botica, reservas)
404.html              Página de error
aviso-legal.html      LSSI-CE
privacidad.html       RGPD / LOPDGDD
cookies.html          Política de cookies (sin cookies)
robots.txt  sitemap.xml  llms.txt  llm.txt  site.webmanifest  og-image.png
```
Favicons pendientes (rutas ya enlazadas en todas las páginas): `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`.

## Reservas
El calendario genera un mensaje de WhatsApp para +34 722 23 40 72 con servicio, fecha, hora y nombre. No se almacenan datos.
