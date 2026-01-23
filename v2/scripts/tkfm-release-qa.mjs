import fs from "fs";
import path from "path";

function nowISO() { return new Date().toISOString(); }

const args = process.argv.slice(2);
const baseArgIndex = args.indexOf("--base");
const BASE = baseArgIndex !== -1 && args[baseArgIndex + 1] ? args[baseArgIndex + 1] : "http://localhost:5173";
const TIMEOUT_MS = Number((args.includes("--timeout") ? args[args.indexOf("--timeout")+1] : null) || 3500);

const ROOT = process.cwd();
const OUTDIR = path.join(ROOT, ".tkfm");
const OUTFILE = path.join(OUTDIR, "release-audit.txt");

const EXCLUDE_FROM_PUBLIC = new Set([
  "/god-view.html",
  "/tkfm-dev-console.html",
  "/vite-build-entry.html",
  "/ai-dj-engine.html",
  "/ai-dj-console.html",
]);

function listRootHtml() {
  return fs.readdirSync(ROOT)
    .filter(f => f.toLowerCase().endsWith(".html"))
    .map(f => "/" + f)
    .sort();
}

function normalizeHref(href) {
  if (!href) return null;
  const clean = href.split("#")[0].split("?")[0].trim();
  if (!clean) return null;
  if (clean.startsWith("http://") || clean.startsWith("https://")) return null;
  if (clean.startsWith("mailto:") || clean.startsWith("tel:")) return null;
  if (clean.startsWith("/")) return clean;
  if (clean.toLowerCase().endsWith(".html")) return "/" + clean;
  return null;
}

function extractLinksFromHtml(html) {
  const links = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const norm = normalizeHref(m[1]);
    if (norm) links.push(norm);
  }
  return Array.from(new Set(links)).sort();
}

function isOwnerPage(p) { return p.startsWith("/owner-"); }
function isPublicPage(p) {
  if (isOwnerPage(p)) return false;
  if (EXCLUDE_FROM_PUBLIC.has(p)) return false;
  return true;
}

async function fetchStatus(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: "manual", cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
    return { ok: res.status >= 200 && res.status < 300, status: res.status };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, status: 0, error: String(e?.name === "AbortError" ? "timeout" : (e?.message || e)) };
  }
}

async function runBatched(items, worker, concurrency=10) {
  const out = [];
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      out[i] = await worker(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => next());
  await Promise.all(workers);
  return out;
}

async function main() {
  fs.mkdirSync(OUTDIR, { recursive: true });

  let report = "";
  report += "TKFM RELEASE QA\n";
  report += `Time: ${nowISO()}\n`;
  report += `Base: ${BASE}\n`;
  report += `Timeout: ${TIMEOUT_MS}ms\n\n`;

  const homepage = await fetchStatus(`${BASE}/`);
  report += `Homepage: ${homepage.ok ? "200 OK" : `FAIL (${homepage.status})`} (${BASE}/)\n`;

  const sitemapUrl = `${BASE}/tkfm-sitemap.html`;
  const sitemap = await fetchStatus(sitemapUrl);
  report += `Sitemap:   ${sitemap.ok ? "200 OK" : `FAIL (${sitemap.status})`} (${sitemapUrl})\n\n`;

  let homepageHtml = "";
  try { homepageHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8"); } catch {}
  const hasSitemapLink = homepageHtml.includes("tkfm-sitemap.html");
  report += `Homepage links include /tkfm-sitemap.html: ${hasSitemapLink ? "YES" : "NO"}\n\n`;

  const rootPagesAll = listRootHtml();
  const rootPublic = rootPagesAll.filter(isPublicPage);
  report += `Public root HTML pages (excluding owner-* and protected): ${rootPublic.length}\n`;

  let sitemapHtml = "";
  try { sitemapHtml = fs.readFileSync(path.join(ROOT, "tkfm-sitemap.html"), "utf8"); } catch {}
  const sitemapLinks = extractLinksFromHtml(sitemapHtml).filter(isPublicPage);

  report += `Sitemap HTML links found (public): ${sitemapLinks.length}\n\n`;

  const missingFromSitemap = rootPublic.filter(p => !sitemapLinks.includes(p));
  if (missingFromSitemap.length) {
    report += "WARN: Public pages missing from sitemap:\n";
    missingFromSitemap.forEach(p => report += ` - ${p}\n`);
    report += "\n";
  }

  report += `Checking reachability for sitemap pages (public): ${sitemapLinks.length}\n\n`;

  const failures = [];
  const results = await runBatched(sitemapLinks, async (p) => {
    const s = await fetchStatus(`${BASE}${p}`);
    return { p, ...s };
  }, 12);

  for (const r of results) {
    if (!r.ok) failures.push(r);
  }

  if (failures.length) {
    report += "FAIL: Pages not reachable (non-200):\n";
    failures.forEach(f => report += ` - ${f.p}  status=${f.status}${f.error ? `  err=${f.error}` : ""}\n`);
    report += "\n";
  } else {
    report += "OK: All sitemap pages reachable (200)\n\n";
  }

  const proChecks = ["/radio-hub.html", "/pricing.html", "/support.html"];
  report += "Professional checks:\n";
  for (const p of proChecks) {
    const s = await fetchStatus(`${BASE}${p}`);
    report += ` - ${p}: ${s.ok ? "OK (200)" : `FAIL (${s.status})${s.error ? ` err=${s.error}` : ""}`}\n`;
  }
  report += "\n";

  fs.writeFileSync(OUTFILE, report, "utf8");
  console.log("DONE: wrote", OUTFILE);
  console.log(report.trimEnd());
}

main();
