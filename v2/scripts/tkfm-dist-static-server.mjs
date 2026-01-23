// TKFM Dist Static Server (Windows-safe, no npx)
// Serves ./dist for local smoke tests.
// Usage: node scripts/tkfm-dist-static-server.mjs --port 9090
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function arg(name, defVal) {
  const a = process.argv.find(x => x === name || x.startsWith(name + "="));
  if (!a) return defVal;
  if (a.includes("=")) return a.split("=").slice(1).join("=");
  const i = process.argv.indexOf(name);
  if (i !== -1 && process.argv[i+1]) return process.argv[i+1];
  return defVal;
}

const PORT = Number(arg("--port", "9090")) || 9090;

const MIME = {
  ".html":"text/html; charset=utf-8",
  ".js":"application/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".svg":"image/svg+xml",
  ".ico":"image/x-icon",
  ".webp":"image/webp",
  ".txt":"text/plain; charset=utf-8",
  ".xml":"application/xml; charset=utf-8",
  ".webmanifest":"application/manifest+json; charset=utf-8",
  ".mp3":"audio/mpeg",
  ".wav":"audio/wav",
  ".m4a":"audio/mp4",
};

function safeJoin(base, reqPath) {
  const p = decodeURIComponent((reqPath || "/").split("?")[0].split("#")[0]);
  const clean = p.replace(/\0/g, "");
  const joined = path.normalize(path.join(base, clean));
  if (!joined.startsWith(base)) return null;
  return joined;
}

function send(res, code, body, headers={}) {
  res.writeHead(code, { "cache-control":"no-store", ...headers });
  res.end(body);
}

function serveFile(res, fp) {
  const ext = path.extname(fp).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const data = fs.readFileSync(fp);
  send(res, 200, data, { "content-type": type });
}

const server = http.createServer((req, res) => {
  try {
    if (!fs.existsSync(DIST)) return send(res, 500, "dist/ not found");

    let urlPath = req.url || "/";
    if (urlPath === "/") urlPath = "/index.html";

    const fp = safeJoin(DIST, urlPath);
    if (!fp) return send(res, 403, "forbidden");

    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) return serveFile(res, fp);

    if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) {
      const idx = path.join(fp, "index.html");
      if (fs.existsSync(idx)) return serveFile(res, idx);
    }

    // Fallback: try .html extension (pretty routes)
    if (!path.extname(fp)) {
      const htmlTry = fp + ".html";
      if (fs.existsSync(htmlTry)) return serveFile(res, htmlTry);
    }

    return send(res, 404, "not found");
  } catch (e) {
    return send(res, 500, String(e && (e.stack || e.message || e)));
  }
});

// IMPORTANT: no host => binds in a Windows-friendly way (works with localhost + 127.0.0.1)
server.listen(PORT, () => {
  console.log(`TKFM DIST SERVER: http://localhost:${PORT}`);
  console.log(`Serving: ${DIST}`);
});
