// TKFM PASS 4 — DIST VERIFY (no server needed)
// Verifies dist contains:
// - all root *.html files
// - tkfm-sitemap.html links resolve to existing files in dist
// - launch polish assets exist
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function exists(p){ try{ fs.accessSync(p); return true; } catch { return false; } }

function listRootHtml(){
  return fs.readdirSync(ROOT).filter(f => f.toLowerCase().endsWith(".html")).sort();
}

function read(file){
  return fs.readFileSync(file, "utf8");
}

function extractHref(html){
  const out = new Set();
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    let h = (m[1] || "").trim();
    if (!h) continue;
    h = h.split("#")[0].split("?")[0];
    if (!h) continue;
    if (h.startsWith("http://") || h.startsWith("https://") || h.startsWith("mailto:") || h.startsWith("tel:")) continue;
    // Normalize relative html to /file.html
    if (h.toLowerCase().endsWith(".html") && !h.startsWith("/")) h = "/" + h;
    if (!h.startsWith("/")) continue;
    out.add(h);
  }
  return Array.from(out).sort();
}

function main(){
  console.log("== TKFM DIST VERIFY ==");
  if (!exists(DIST)) {
    console.log("FAIL: dist/ not found. Run: scripts/tkfm-build-static-multipage.sh");
    process.exit(2);
  }

  const rootPages = listRootHtml();
  const missingInDist = rootPages.filter(p => !exists(path.join(DIST, p)));

  if (missingInDist.length) {
    console.log("FAIL: Missing root HTML files in dist:");
    missingInDist.forEach(p => console.log(" -", p));
    process.exit(2);
  }
  console.log("OK: All root HTML pages are present in dist (" + rootPages.length + ").");

  // Verify sitemap
  const sitemapDist = path.join(DIST, "tkfm-sitemap.html");
  if (!exists(sitemapDist)) {
    console.log("FAIL: dist/tkfm-sitemap.html missing.");
    process.exit(2);
  }

  const sitemapLinks = extractHref(read(sitemapDist))
    .filter(h => h.toLowerCase().endsWith(".html"));

  const missingLinked = [];
  for (const href of sitemapLinks) {
    const file = href.replace(/^\//, "");
    if (!exists(path.join(DIST, file))) missingLinked.push(href);
  }

  if (missingLinked.length) {
    console.log("FAIL: Sitemap links missing from dist:");
    missingLinked.slice(0, 200).forEach(h => console.log(" -", h));
    if (missingLinked.length > 200) console.log(" ...", missingLinked.length - 200, "more");
    process.exit(2);
  }
  console.log("OK: All sitemap-linked pages exist in dist (" + sitemapLinks.length + ").");

  // Verify launch polish assets
  const polishJs = path.join(DIST, "js", "tkfm-launch-polish.js");
  const statusHtml = path.join(DIST, "status.html");
  const missingAssets = [];
  if (!exists(polishJs)) missingAssets.push("dist/js/tkfm-launch-polish.js");
  if (!exists(statusHtml)) missingAssets.push("dist/status.html");

  if (missingAssets.length) {
    console.log("WARN: Missing expected launch polish assets:");
    missingAssets.forEach(a => console.log(" -", a));
  } else {
    console.log("OK: Launch polish assets present (status.html + tkfm-launch-polish.js).");
  }

  console.log("== PASS ==");
}

main();
