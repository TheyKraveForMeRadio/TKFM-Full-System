import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const TARGET_PAGES = [
  "index.html",
  "radio-hub.html",
  "pricing.html",
  "app-hub.html",
  "client-vault.html",
  "tkfm-sitemap.html",
  "tkfm-catalog.html",
  "support.html",
  "terms.html",
  "privacy.html",
  "submit.html",
  "label-home.html",
  "they-krave-for-me-mixtapes.html",
  "ai-drops-engine.html",
  "sponsor-read-engine.html",
  "sponsor-read.html",
  "podcast-engine.html",
  "radio-tv.html"
];

const SCRIPT_TAG = `<script type="module" src="/js/tkfm-launch-polish.js"></script>`;

function patchFile(fp) {
  if (!fs.existsSync(fp)) return { file: fp, changed: false, reason: "missing" };

  let html = fs.readFileSync(fp, "utf8");
  if (html.includes("/js/tkfm-launch-polish.js")) return { file: fp, changed: false, reason: "already" };

  if (!html.includes("</body>")) return { file: fp, changed: false, reason: "no </body>" };

  html = html.replace("</body>", `  ${SCRIPT_TAG}\n</body>`);
  fs.writeFileSync(fp, html, "utf8");
  return { file: fp, changed: true, reason: "patched" };
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function main() {
  // Patch key pages to include launch polish script
  let changed = 0, skipped = 0;
  for (const f of TARGET_PAGES) {
    const r = patchFile(path.join(ROOT, f));
    if (r.changed) { console.log(" + patched", f); changed++; }
    else { skipped++; }
  }

  // Ensure status page exists (if missing, warn)
  if (!fs.existsSync(path.join(ROOT, "status.html"))) {
    console.log("WARN: status.html missing — ensure it exists from the patch zip.");
  }

  // Ensure js folder exists
  ensureDir(path.join(ROOT, "js"));

  console.log(`DONE: launch polish applied. changed=${changed} skipped=${skipped}`);
}

main();
