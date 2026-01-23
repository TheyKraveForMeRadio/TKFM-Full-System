import fs from "fs";

const file = "tkfm-sitemap.html";
if (!fs.existsSync(file)) {
  console.error("ERROR: tkfm-sitemap.html not found.");
  process.exit(1);
}

let html = fs.readFileSync(file, "utf8");

// already present?
if (html.includes('href="/status.html"') || html.includes("href='/status.html'")) {
  console.log("OK: /status.html already in sitemap.");
  process.exit(0);
}

// Insert status link right after the grid starts
const gridTag = '<div class="grid">';
const idx = html.indexOf(gridTag);

const link = `      <a href="/status.html"><div style="font-weight:900">Status</div><div class="tag">System</div></a>\n`;

if (idx !== -1) {
  const insertPos = idx + gridTag.length;
  html = html.slice(0, insertPos) + "\n" + link + html.slice(insertPos);
  fs.writeFileSync(file, html, "utf8");
  console.log("DONE: inserted /status.html into sitemap grid.");
  process.exit(0);
}

// Fallback: insert before </body>
if (html.includes("</body>")) {
  html = html.replace("</body>", `\n<!-- TKFM_SITEMAP_STATUS -->\n${link}</body>`);
  fs.writeFileSync(file, html, "utf8");
  console.log("DONE: appended /status.html into sitemap (fallback).");
  process.exit(0);
}

console.log("FAIL: could not insert (no grid + no </body>).");
process.exit(2);
