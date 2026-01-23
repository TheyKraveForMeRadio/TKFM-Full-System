import fs from "fs";

const ROOT = process.cwd();
const EXCLUDE = new Set(["vite-build-entry.html","god-view.html","tkfm-dev-console.html"]);
const isOwner = (f) => f.startsWith("owner-");
const isHtml = (f) => f.toLowerCase().endsWith(".html");

const pages = fs.readdirSync(ROOT)
  .filter(isHtml)
  .filter(f => !isOwner(f))
  .filter(f => !EXCLUDE.has(f))
  .sort((a,b) => a.localeCompare(b));

function titleFor(file){
  const base=file.replace(/\.html$/i,"").replace(/[-_]/g," ").trim();
  return base.split(" ").map(w=>w?(w[0].toUpperCase()+w.slice(1)):"").join(" ");
}
function tagFor(file){
  const p=file.toLowerCase();
  if (p.includes("radio")) return "Radio";
  if (p.includes("label")||p.includes("records")) return "Records";
  if (p.includes("sponsor")) return "Sponsor";
  if (p.includes("drops")||p.includes("ai-")) return "AI / Drops";
  if (p.includes("mixtape")) return "Mixtapes";
  if (p.includes("podcast")) return "Podcast";
  if (p.includes("pricing")) return "Pricing";
  if (p.includes("support")||p.includes("contact")) return "Support";
  return "Page";
}

const head = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>TKFM — Sitemap</title>
  <meta name="robots" content="index,follow"/>
  <link rel="icon" href="/favicon.ico"/>
  <style>
    body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#020617;color:#e2e8f0}
    .wrap{max-width:1100px;margin:0 auto;padding:26px}
    h1{margin:0 0 10px 0;font-size:28px}
    p{margin:0 0 16px 0;color:#94a3b8;line-height:1.5}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}
    a{display:block;padding:12px 14px;border-radius:14px;text-decoration:none;color:#e2e8f0;
      border:1px solid rgba(168,85,247,.22);background:rgba(15,23,42,.55)}
    a:hover{border-color:rgba(34,211,238,.45);transform:translateY(-1px)}
    .tag{font-size:12px;color:#94a3b8;margin-top:6px}
    .top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
    .btn{padding:10px 14px;border-radius:999px;font-weight:900;color:#020617;text-decoration:none;
      background:linear-gradient(90deg,#22d3ee,#a855f7,#ec4899)}
    .note{margin-top:14px;color:#64748b;font-size:12px}
    .hr{height:1px;background:rgba(148,163,184,.18);margin:14px 0}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div>
        <h1>TKFM Sitemap</h1>
        <p>Every public page in TKFM V2 (static links for customers + QA).</p>
      </div>
      <a class="btn" href="/index.html">Back to Home</a>
    </div>
    <div class="hr"></div>
    <div class="grid">
`;

let body = "";
for (const file of pages) {
  body += `      <a href="/${file}"><div style="font-weight:900">${titleFor(file)}</div><div class="tag">${tagFor(file)}</div></a>\n`;
}

const foot = `
    </div>
    <div class="note">Generated: ${new Date().toISOString()} • Pages: ${pages.length}</div>
  </div>
</body>
</html>
`;

fs.writeFileSync("tkfm-sitemap.html", head + body + foot, "utf8");
console.log(`DONE: tkfm-sitemap.html regenerated with ${pages.length} pages.`);
