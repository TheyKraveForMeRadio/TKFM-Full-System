import fs from "fs";
import path from "path";

const root = process.cwd();
const candidates = ["vite.config.js","vite.config.mjs","vite.config.ts"];
const cfg = candidates.map(f => path.join(root,f)).find(p => fs.existsSync(p));

if (!cfg) {
  console.error("ERROR: No vite.config.js/mjs/ts found in project root.");
  process.exit(1);
}

let src = fs.readFileSync(cfg, "utf8");

// If proxy already points to 9999, done.
if (src.includes("target: 'http://localhost:9999'") || src.includes('target: "http://localhost:9999"')) {
  console.log("OK: Vite proxy already locked to http://localhost:9999");
  process.exit(0);
}

// Insert/patch server.proxy for /.netlify/functions
// Strategy:
// 1) If server: { ... } exists and proxy exists: replace its target to localhost:9999
// 2) If server exists but no proxy: inject proxy block
// 3) If no server block: inject server block into defineConfig({...})
const proxyBlock = `
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
        secure: false
      }
    },
`;

function replaceProxyTarget(text) {
  // Replace any existing target for '/.netlify/functions' block
  return text.replace(
    /(\/\.netlify\/functions['"]\s*:\s*\{\s*[^}]*target\s*:\s*['"])(http:\/\/localhost:\d+)(['"])/m,
    `$1http://localhost:9999$3`
  );
}

let out = src;

// Case 1: has /.netlify/functions proxy already
if (out.match(/\/\.netlify\/functions['"]\s*:\s*\{/m)) {
  out = replaceProxyTarget(out);
  fs.writeFileSync(cfg, out);
  console.log("DONE: Updated existing /.netlify/functions proxy target → http://localhost:9999");
  process.exit(0);
}

// Case 2: has server: { ... } but no proxy
if (out.match(/\bserver\s*:\s*\{/m)) {
  out = out.replace(/\bserver\s*:\s*\{\s*/m, match => match + proxyBlock);
  fs.writeFileSync(cfg, out);
  console.log("DONE: Injected server.proxy for /.netlify/functions → http://localhost:9999");
  process.exit(0);
}

// Case 3: no server block — inject into defineConfig({ ... })
if (out.match(/defineConfig\s*\(\s*\{\s*/m)) {
  out = out.replace(/defineConfig\s*\(\s*\{\s*/m, m => m + `\n  server: {\n${proxyBlock}  },\n`);
  fs.writeFileSync(cfg, out);
  console.log("DONE: Added server.proxy for /.netlify/functions → http://localhost:9999");
  process.exit(0);
}

console.error("ERROR: Could not safely patch Vite config (unexpected format).");
process.exit(1);
