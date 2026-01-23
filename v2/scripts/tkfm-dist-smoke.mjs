// TKFM PASS 5 — Dist Smoke Test (always writes .tkfm/dist-release-audit.txt)
// Starts a static server for ./dist, runs tkfm-release-qa.mjs against it,
// captures stdout/stderr, writes dist audit, then shuts down.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const TKFM_DIR = path.join(ROOT, ".tkfm");
const DIST_AUDIT = path.join(TKFM_DIR, "dist-release-audit.txt");
const DIST_LOG = path.join(TKFM_DIR, "dist-smoke.log");

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

function startServer() {
  if (!fs.existsSync(DIST)) {
    console.error("FAIL: dist/ not found. Run: scripts/tkfm-build-static-multipage.sh");
    process.exit(2);
  }

  const server = http.createServer((req, res) => {
    try {
      let urlPath = req.url || "/";
      if (urlPath === "/") urlPath = "/index.html";

      const fp = safeJoin(DIST, urlPath);
      if (!fp) return send(res, 403, "forbidden");

      if (fs.existsSync(fp) && fs.statSync(fp).isFile()) return serveFile(res, fp);

      if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) {
        const idx = path.join(fp, "index.html");
        if (fs.existsSync(idx)) return serveFile(res, idx);
      }

      if (!path.extname(fp)) {
        const htmlTry = fp + ".html";
        if (fs.existsSync(htmlTry)) return serveFile(res, htmlTry);
      }

      return send(res, 404, "not found");
    } catch (e) {
      return send(res, 500, String(e && (e.stack || e.message || e)));
    }
  });

  return new Promise((resolve) => {
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

function printShortSummary(txt) {
  const lines = txt.split(/\r?\n/);
  const summary = [];
  for (const ln of lines) {
    if (
      ln.startsWith("Base: ") ||
      ln.startsWith("Homepage:") ||
      ln.startsWith("Sitemap:") ||
      ln.startsWith("OK: All sitemap pages reachable") ||
      ln.startsWith("FAIL: Pages not reachable") ||
      ln.startsWith("Professional checks:")
    ) summary.push(ln);
  }
  const idx = lines.findIndex(l => l.startsWith("Professional checks:"));
  if (idx !== -1) {
    for (let i = idx+1; i < Math.min(lines.length, idx+6); i++) summary.push(lines[i]);
  }
  console.log("\n== DIST QA SUMMARY ==");
  console.log(summary.join("\n").trimEnd());
  console.log("== END SUMMARY ==\n");
}

async function main() {
  fs.mkdirSync(TKFM_DIR, { recursive: true });

  console.log("== TKFM PASS 5 — DIST SMOKE ==");
  const server = await startServer();
  const base = `http://localhost:${PORT}`;

  console.log("DIST server up:", base);
  console.log("Running QA against dist...\n");

  const r = spawnSync(
    process.execPath,
    ["scripts/tkfm-release-qa.mjs", "--base", base],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );

  const out = (r.stdout || "") + (r.stderr || "");
  fs.writeFileSync(DIST_LOG, out, "utf8");
  fs.writeFileSync(DIST_AUDIT, out, "utf8");

  printShortSummary(out);
  console.log("Saved:", DIST_AUDIT);
  console.log("Log:  ", DIST_LOG);

  const code = r.status ?? 1;

  server.close(() => {
    console.log("DIST server stopped.");
    process.exit(code);
  });
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
