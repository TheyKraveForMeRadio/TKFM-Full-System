import { spawn } from "node:child_process";
import net from "node:net";

const FNS_PORT = Number(process.env.TKFM_FUNCTIONS_PORT || "9999") || 9999;
const START_PAGES_PORT = Number(process.env.TKFM_PAGES_PORT || "5173") || 5173;

const HEALTH_URL = `http://127.0.0.1:${FNS_PORT}/.netlify/functions/_health`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isPortOpen(port) {
  return new Promise((resolve) => {
    const s = net.createConnection({ host: "127.0.0.1", port }, () => {
      s.end();
      resolve(true);
    });
    s.on("error", () => resolve(false));
  });
}

async function findFreePort(start, maxTries = 50) {
  let p = start;
  for (let i = 0; i < maxTries; i++) {
    const open = await isPortOpen(p);
    if (!open) return p;
    p++;
  }
  throw new Error(`No free port found starting at ${start}`);
}

async function healthOk() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 900);
    const res = await fetch(HEALTH_URL, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

function spawnNodeFunctions() {
  // node scripts/tkfm-functions-serve.mjs --port 9999
  return spawn(
    process.execPath,
    ["scripts/tkfm-functions-serve.mjs", "--port", String(FNS_PORT)],
    { stdio: "inherit", windowsHide: true }
  );
}

function spawnVite(pagesPort) {
  // IMPORTANT: On Windows + Git Bash, spawning npm can throw EINVAL.
  // Use cmd.exe /c to start npm reliably.
  if (process.platform === "win32") {
    const cmd = `npm run dev -- --host --port ${pagesPort}`;
    return spawn("cmd.exe", ["/d", "/s", "/c", cmd], { stdio: "inherit", windowsHide: true });
  }

  // Non-windows
  return spawn("npm", ["run", "dev", "--", "--host", "--port", String(pagesPort)], { stdio: "inherit" });
}

async function main() {
  console.log("== TKFM DEV UP (Node Orchestrator) ==");
  console.log(`Functions target: http://localhost:${FNS_PORT}  (expected Vite proxy target: http://127.0.0.1:${FNS_PORT})`);
  console.log(`Pages start port: ${START_PAGES_PORT}`);
  console.log("");

  let fnsChild = null;

  if (await healthOk()) {
    console.log(`[FNS] Reusing existing functions server on :${FNS_PORT}`);
  } else {
    console.log(`[FNS] Starting TKFM functions server on :${FNS_PORT}`);
    fnsChild = spawnNodeFunctions();

    let ok = false;
    for (let i = 0; i < 40; i++) {
      if (await healthOk()) { ok = true; break; }
      await sleep(250);
    }
    if (!ok) {
      console.error(`[FNS] FAIL: health did not respond at ${HEALTH_URL}`);
      try { fnsChild.kill(); } catch {}
      process.exit(1);
    }
    console.log(`[FNS] OK: functions server healthy on :${FNS_PORT}`);
  }

  const pagesPort = await findFreePort(START_PAGES_PORT, 80);
  console.log(`[PAGES] Starting Vite on :${pagesPort}...`);
  console.log(`Local: http://localhost:${pagesPort}/`);
  console.log("");

  let viteChild;
  try {
    viteChild = spawnVite(pagesPort);
  } catch (e) {
    console.error("FATAL: failed to spawn Vite.");
    console.error(String(e && (e.stack || e.message || e)));
    try { if (fnsChild) fnsChild.kill(); } catch {}
    process.exit(1);
  }

  const shutdown = () => {
    try { if (viteChild) viteChild.kill("SIGINT"); } catch {}
    try { if (fnsChild) fnsChild.kill("SIGINT"); } catch {}
  };

  process.on("SIGINT", () => { shutdown(); process.exit(0); });
  process.on("SIGTERM", () => { shutdown(); process.exit(0); });
  process.on("exit", shutdown);

  viteChild.on("exit", (code) => {
    console.log(`[PAGES] Vite exited with code ${code}`);
    shutdown();
    process.exit(code ?? 0);
  });

  viteChild.on("error", (err) => {
    console.error("[PAGES] Vite spawn error:", err);
    shutdown();
    process.exit(1);
  });
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
