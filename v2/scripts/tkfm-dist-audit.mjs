import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }

function listRootHtml() {
  return fs.readdirSync(ROOT).filter(f => f.toLowerCase().endsWith(".html")).sort();
}

function run() {
  const pages = listRootHtml();
  console.log("== TKFM DIST AUDIT ==");
  console.log("Root HTML pages:", pages.length);

  if (!exists(DIST)) {
    console.log("FAIL: dist/ not found. Run: scripts/tkfm-build-static-multipage.sh");
    process.exit(2);
  }

  const missing = pages.filter(p => !exists(path.join(DIST, p)));
  if (missing.length) {
    console.log("FAIL: Missing pages in dist:");
    missing.forEach(p => console.log(" -", p));
    process.exit(2);
  }

  console.log("OK: All root HTML pages exist in dist/");

  const mustHave = ["_redirects", "tkfm-radio-logo.png", "tkfm-records-logo.png"];
  const missingAssets = mustHave.filter(a => !exists(path.join(DIST, a)));
  if (missingAssets.length) {
    console.log("WARN: Missing expected dist assets:");
    missingAssets.forEach(a => console.log(" -", a));
  } else {
    console.log("OK: Key dist assets present (logos + _redirects).");
  }

  console.log("== DONE ==");
}

run();
