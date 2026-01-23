import http from "http";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const ROOT = process.cwd();
const FUNCTIONS_DIR = path.join(ROOT, "netlify", "functions");

function getPort() {
  const a = process.argv.find(x => x.startsWith("--port="));
  if (a) {
    const n = Number(a.split("=")[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const i = process.argv.indexOf("--port");
  if (i !== -1 && process.argv[i + 1]) {
    const n = Number(process.argv[i + 1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const env = Number(process.env.TKFM_FUNCTIONS_PORT || "9999");
  return Number.isFinite(env) && env > 0 ? env : 9999;
}

const PORT = getPort();

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", () => resolve(""));
  });
}

function findFunctionFile(name) {
  const candidates = [
    path.join(FUNCTIONS_DIR, `${name}.js`),
    path.join(FUNCTIONS_DIR, `${name}.mjs`),
    path.join(FUNCTIONS_DIR, `${name}.cjs`),
    path.join(FUNCTIONS_DIR, name, "index.js"),
    path.join(FUNCTIONS_DIR, name, "index.mjs"),
    path.join(FUNCTIONS_DIR, name, "index.cjs"),
  ];
  return candidates.find(p => fs.existsSync(p)) || null;
}

async function loadHandler(filePath) {
  const stat = fs.statSync(filePath);
  const u = pathToFileURL(filePath);
  u.searchParams.set("v", String(stat.mtimeMs)); // cache-bust on edits

  const mod = await import(u.toString());
  const h =
    mod?.handler ||
    mod?.default?.handler ||
    mod?.default ||
    mod;

  return typeof h === "function" ? h : null;
}

function toEvent(req, urlObj, bodyRaw) {
  const headers = {};
  for (const k of Object.keys(req.headers || {})) headers[k] = String(req.headers[k]);

  const queryStringParameters = {};
  urlObj.searchParams.forEach((v, k) => { queryStringParameters[k] = v; });

  return {
    httpMethod: req.method || "GET",
    path: urlObj.pathname,
    headers,
    queryStringParameters,
    body: bodyRaw || null,
    isBase64Encoded: false
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url || "/", "http://127.0.0.1");

    // Health endpoint for dev-up checks
    if (urlObj.pathname === "/.netlify/functions/_health") {
      return json(res, 200, {
        ok: true,
        port: PORT,
        node: process.version,
        functionsDir: FUNCTIONS_DIR
      });
    }

    if (!urlObj.pathname.startsWith("/.netlify/functions/")) {
      return json(res, 404, { error: "Not a Netlify functions route" });
    }

    const name = urlObj.pathname.replace("/.netlify/functions/", "").split("/")[0];
    if (!name) return json(res, 400, { error: "Missing function name" });

    if (!fs.existsSync(FUNCTIONS_DIR)) {
      return json(res, 500, { error: `Functions dir missing: ${FUNCTIONS_DIR}` });
    }

    const filePath = findFunctionFile(name);
    if (!filePath) return json(res, 404, { error: `Function not found: ${name}` });

    const handler = await loadHandler(filePath);
    if (!handler) return json(res, 500, { error: `No handler export in: ${path.basename(filePath)}` });

    const bodyRaw = await readBody(req);
    const event = toEvent(req, urlObj, bodyRaw);

    const result = await handler(event, {});

    const statusCode = Number(result?.statusCode || 200);
    const headers = result?.headers || { "content-type": "application/json; charset=utf-8" };
    const body = result?.body ?? "";

    res.writeHead(statusCode, headers);
    res.end(body);
  } catch (e) {
    return json(res, 500, { error: String(e && e.stack ? e.stack : e) });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("== TKFM Functions Server ==");
  console.log("Node:     ", process.version);
  console.log("Root:     ", ROOT);
  console.log("Dir:      ", FUNCTIONS_DIR);
  console.log("Listening:", `http://localhost:${PORT}`);
  console.log("Route:    ", "/.netlify/functions/<name>");
});
