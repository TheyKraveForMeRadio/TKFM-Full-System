// Apply Launch Polish script tag to ALL public root HTML pages (excluding owner-* and protected pages)
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const EXCLUDE = new Set([
  "vite-build-entry.html",
  "god-view.html",
  "tkfm-dev-console.html",
]);

const SCRIPT_TAG = `<script type="module" src="/js/tkfm-launch-polish.js"></script>`;

function isHtml(f) { return f.toLowerCase().endsWith(".html"); }
function isOwner(f) { return f.startsWith("owner-"); }

function patchFile(file) {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) return { file, changed: false, reason: "missing" };
  let html = fs.readFileSync(fp, "utf8");

  if (html.includes("/js/tkfm-launch-polish.js")) return { file, changed: false, reason: "already" };
  if (!html.includes("</body>")) return { file, changed: false, reason: "no </body>" };

  html = html.replace("</body>", `  ${SCRIPT_TAG}\n</body>`);
  fs.writeFileSync(fp, html, "utf8");
  return { file, changed: true, reason: "patched" };
}

function main() {
  const files = fs.readdirSync(ROOT).filter(isHtml).filter(f => !isOwner(f)).filter(f => !EXCLUDE.has(f));

  let changed = 0, skipped = 0, noBody = 0;
  for (const f of files) {
    const r = patchFile(f);
    if (r.changed) {
      console.log(" + patched", f);
      changed++;
    } else {
      skipped++;
      if (r.reason === "no </body>") noBody++;
    }
  }

  console.log(`DONE: launch polish applied to public pages. changed=${changed} skipped=${skipped} no_body=${noBody}`);
}

main();
