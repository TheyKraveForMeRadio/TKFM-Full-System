import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";

const DIST = path.join(process.cwd(), "dist");

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
};

function safeJoin(base, reqPath) {
  const p = decodeURIComponent((reqPath || "/").split("?")[0].split("#")[0]);
  const joined = path.normalize(path.join(base, p.replace(/\0/g, "")));
  if (!joined.startsWith(base)) return null;
  return joined;
}

function send(res, code, body, headers = {}) {
  res.writeHead(code, { "cache-control": "no-store", ...headers });
  res.end(body);
}

function serveFile(res, fp) {
  const ext = path.extname(fp).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const data = fs.readFileSync(fp);
  send(res, 200, data, { "content-type": type });
}

function portFree(port) {
  return new Promise((resolve) => {
    const s = net.createConnection({ host: "127.0.0.1", port }, () => { s.end(); resolve(false); });
    s.on("error", () => resolve(true));
  });
}

async function pickPort(start = 9090, tries = 30) {
  let p = start;
  for (let i = 0; i < tries; i++) {
    if (await portFree(p)) return p;
    p++;
  }
  throw new Error("No free port found");
}

async function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        if (!fs.existsSync(DIST)) return send(res, 500, "dist/ not found");
        let urlPath = req.url || "/";
        if (urlPath === "/") urlPath = "/index.html";

        const fp = safeJoin(DIST, urlPath);
        if (!fp) return send(res, 403, "forbidden");

        if (fs.existsSync(fp) && fs.statSync(fp).isFile()) return serveFile(res, fp);

        if (!path.extname(fp)) {
          const htmlTry = fp + ".html";
          if (fs.existsSync(htmlTry)) return serveFile(res, htmlTry);
        }

        return send(res, 404, "not found");
      } catch (e) {
        return send(res, 500, String(e && (e.stack || e.message || e)));
      }
    });

    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function runQa(base) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["scripts/tkfm-release-qa.mjs", "--base", base, "--timeout", "2500"],
      { stdio: "inherit" }
    );
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function main() {
  if (!fs.existsSync(DIST)) {
    console.error("FAIL: dist/ not found. Run scripts/tkfm-build-static-multipage.sh first.");
    process.exit(2);
  }

  const port = await pickPort(9090, 30);
  const server = await startServer(port);
  const base = `http://127.0.0.1:${port}`;

  console.log("== TKFM DIST QA ONECMD ==");
  console.log("Server:", base);

  const code = await runQa(base);

  server.close(() => process.exit(code));
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
