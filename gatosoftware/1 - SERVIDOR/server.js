/* ============================================================================
   GATO · Servidor de datos (MariaDB / MySQL)
   ----------------------------------------------------------------------------
   Mini-servidor sin dependencias raras: solo Node.js + el conector "mysql2".
   Hace tres cosas:
     1) SIRVE la aplicación GATO (la web) a todos los equipos de la oficina.
     2) Expone una pequeña API REST que lee/escribe en MariaDB.
     3) Crea la base de datos y las tablas automáticamente la primera vez
        y hace copias de seguridad periódicas en la carpeta compartida.

   No hay que tocar este archivo. La configuración está en  config.json.
   ============================================================================ */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

// ── Configuración ───────────────────────────────────────────────────────────
function loadConfig() {
  const def = {
    http: { port: 8090, host: "0.0.0.0" },
    db: { host: "127.0.0.1", port: 3306, user: "gato", password: "gato", database: "gato" },
    backup: { enabled: true, dir: "./copias-de-seguridad", everyMinutes: 30, keep: 200 },
  };
  try {
    const raw = fs.readFileSync(path.join(__dirname, "config.json"), "utf8");
    const cfg = JSON.parse(raw);
    return {
      http: Object.assign(def.http, cfg.http || {}),
      db: Object.assign(def.db, cfg.db || {}),
      backup: Object.assign(def.backup, cfg.backup || {}),
    };
  } catch (e) {
    console.log("  · No se encontró config.json; uso valores por defecto.");
    return def;
  }
}
const CFG = loadConfig();

// ── Conexión a MariaDB con reintentos y autocreación ──────────────────────────
let pool = null;
let dbReady = false;

async function waitForServer() {
  // Espera a que el motor MariaDB acepte conexiones (puede tardar en arrancar).
  for (let intento = 1; intento <= 60; intento++) {
    try {
      const c = await mysql.createConnection({
        host: CFG.db.host, port: CFG.db.port, user: CFG.db.user, password: CFG.db.password,
        connectTimeout: 4000,
      });
      // Crea la base de datos si no existe (juego de caracteres completo para acentos/emoji).
      await c.query(
        "CREATE DATABASE IF NOT EXISTS `" + CFG.db.database + "` " +
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
      );
      await c.end();
      return true;
    } catch (e) {
      if (intento === 1) console.log("  · Esperando a que MariaDB esté disponible…");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return false;
}

async function ensureSchema() {
  // Tabla del espacio de trabajo: UNA fila (id=1) con todo el estado como JSON
  // y un número de revisión que crece en cada guardado.
  await pool.query(
    "CREATE TABLE IF NOT EXISTS `workspace` (" +
    "  `id`      INT          NOT NULL PRIMARY KEY," +
    "  `rev`     BIGINT       NOT NULL DEFAULT 0," +
    "  `writer`  VARCHAR(64)  NULL," +
    "  `data`    LONGTEXT     NULL," +
    "  `updated` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
  );
}

async function initDB() {
  const ok = await waitForServer();
  if (!ok) { console.log("  ✗ No se pudo conectar con MariaDB. Revisa config.json y que el motor esté arrancado."); return; }
  pool = await mysql.createPool({
    host: CFG.db.host, port: CFG.db.port, user: CFG.db.user, password: CFG.db.password,
    database: CFG.db.database, waitForConnections: true, connectionLimit: 10, charset: "utf8mb4",
  });
  await ensureSchema();
  dbReady = true;
  console.log("  ✓ Base de datos lista (" + CFG.db.database + " en " + CFG.db.host + ":" + CFG.db.port + ")");
}

// ── Operaciones de datos ──────────────────────────────────────────────────────
async function getWorkspace() {
  const [rows] = await pool.query("SELECT rev, writer, data FROM workspace WHERE id = 1");
  if (!rows.length) return { rev: 0, by: null, data: null };
  return { rev: Number(rows[0].rev) || 0, by: rows[0].writer || null, data: rows[0].data };
}
async function getRev() {
  const [rows] = await pool.query("SELECT rev, writer FROM workspace WHERE id = 1");
  if (!rows.length) return { rev: 0, by: null };
  return { rev: Number(rows[0].rev) || 0, by: rows[0].writer || null };
}
async function saveWorkspace(data, by) {
  // Incremento de revisión atómico (transacción + bloqueo de fila).
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT rev FROM workspace WHERE id = 1 FOR UPDATE");
    let rev;
    if (rows.length) {
      rev = Number(rows[0].rev) + 1;
      await conn.query("UPDATE workspace SET rev = ?, writer = ?, data = ? WHERE id = 1", [rev, by || null, data]);
    } else {
      rev = 1;
      await conn.query("INSERT INTO workspace (id, rev, writer, data) VALUES (1, ?, ?, ?)", [rev, by || null, data]);
    }
    await conn.commit();
    return rev;
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    throw e;
  } finally {
    conn.release();
  }
}

// ── Copias de seguridad automáticas a la carpeta compartida ───────────────────
async function doBackup() {
  if (!CFG.backup.enabled || !dbReady) return;
  try {
    const ws = await getWorkspace();
    if (ws.data == null) return; // nada que respaldar todavía
    const dir = path.isAbsolute(CFG.backup.dir) ? CFG.backup.dir : path.join(__dirname, CFG.backup.dir);
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const file = path.join(dir, "gato-backup-" + stamp + ".json");
    const payload = JSON.stringify({ _app: "GATO", _rev: ws.rev, _at: new Date().toISOString(), data: ws.data });
    fs.writeFileSync(file, payload, "utf8");
    // Conserva solo las últimas N copias.
    const keep = Math.max(5, CFG.backup.keep || 200);
    const all = fs.readdirSync(dir).filter((f) => /^gato-backup-.*\.json$/.test(f)).sort();
    while (all.length > keep) { try { fs.unlinkSync(path.join(dir, all.shift())); } catch (_) {} }
  } catch (e) { console.log("  · Aviso: no se pudo hacer la copia de seguridad (" + e.message + ")"); }
}

// ── Servidor HTTP: API + archivos estáticos de la app ─────────────────────────
const PUBLIC_DIR = path.join(__dirname, "public");
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".map": "application/json",
};

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ""; let size = 0;
    req.on("data", (c) => { size += c.length; if (size > 64 * 1024 * 1024) { reject(new Error("payload demasiado grande")); req.destroy(); } else data += c; });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url.split("?")[0]) || "/");
  if (urlPath === "/" || urlPath === "") urlPath = "/index.html";
  // Evita salir de la carpeta public (seguridad).
  const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(PUBLIC_DIR, safe);
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end("Prohibido"); return; }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      // SPA: si no existe el recurso, devolvemos la app (index.html).
      filePath = path.join(PUBLIC_DIR, "index.html");
      fs.readFile(filePath, (e2, buf) => {
        if (e2) { res.writeHead(404); res.end("No encontrado"); return; }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(buf);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (e2, buf) => {
      if (e2) { res.writeHead(500); res.end("Error"); return; }
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(buf);
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split("?")[0];

  // ---- API ----
  if (url.indexOf("/api/") === 0) {
    // CORS abierto en red local (los equipos abren la app desde el propio servidor).
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    if (url === "/api/health") return sendJSON(res, 200, { ok: true, db: dbReady });

    if (!dbReady) return sendJSON(res, 503, { error: "base de datos no disponible todavía" });

    try {
      if (url === "/api/workspace" && req.method === "GET") return sendJSON(res, 200, await getWorkspace());
      if (url === "/api/workspace/rev" && req.method === "GET") return sendJSON(res, 200, await getRev());
      if (url === "/api/workspace" && req.method === "POST") {
        const body = await readBody(req);
        let parsed; try { parsed = JSON.parse(body); } catch (e) { return sendJSON(res, 400, { error: "JSON no válido" }); }
        if (typeof parsed.data !== "string") return sendJSON(res, 400, { error: "falta 'data'" });
        const rev = await saveWorkspace(parsed.data, parsed.by);
        return sendJSON(res, 200, { rev: rev });
      }
      return sendJSON(res, 404, { error: "ruta no encontrada" });
    } catch (e) {
      console.log("  · Error de API: " + e.message);
      return sendJSON(res, 500, { error: "error interno" });
    }
  }

  // ---- Archivos de la app ----
  if (req.method === "GET") return serveStatic(req, res);
  res.writeHead(405); res.end("Método no permitido");
});

// ── Arranque ──────────────────────────────────────────────────────────────────
function localIPs() {
  const os = require("os"); const out = [];
  const ifs = os.networkInterfaces();
  for (const name in ifs) for (const i of ifs[name]) if (i.family === "IPv4" && !i.internal) out.push(i.address);
  return out;
}

(async function main() {
  console.log("\n  ============================================================");
  console.log("     SERVIDOR GATO  ·  base de datos MariaDB");
  console.log("  ============================================================\n");
  await initDB();

  server.listen(CFG.http.port, CFG.http.host, () => {
    console.log("\n     La aplicación GATO está disponible en:\n");
    console.log("        · En ESTE equipo (servidor):  http://localhost:" + CFG.http.port);
    localIPs().forEach((ip) => console.log("        · Desde los demás equipos:    http://" + ip + ":" + CFG.http.port));
    console.log("\n  ------------------------------------------------------------");
    console.log("     IMPORTANTE: NO CIERRES esta ventana mientras se use GATO.");
    console.log("  ------------------------------------------------------------\n");
  });

  // Copias de seguridad periódicas.
  if (CFG.backup.enabled) {
    const ms = Math.max(5, CFG.backup.everyMinutes || 30) * 60 * 1000;
    setInterval(doBackup, ms);
    setTimeout(doBackup, 60 * 1000); // una copia al minuto de arrancar
  }
})();

process.on("uncaughtException", (e) => console.log("  · Aviso (continuo en marcha): " + e.message));
process.on("unhandledRejection", (e) => console.log("  · Aviso (continuo en marcha): " + (e && e.message)));
