// Apply Start Here funnel page into nav + sitemap (safe)
import fs from "fs";

function insertLinkIntoNav(html, href, label) {
  if (html.includes(`href="${href}"`) || html.includes(`href='${href}'`)) return html;

  // try header nav insertion after Home if present
  const navClose = html.indexOf("</nav>");
  if (navClose !== -1) {
    const before = html.slice(0, navClose);
    const after = html.slice(navClose);

    // insert near end of nav
    const link = `        <a class="pill" href="${href}">${label}</a>
`;
    return before + link + after;
  }

  return html;
}

function patchFile(file) {
  if (!fs.existsSync(file)) return { file, changed: false, reason: "missing" };
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  html = insertLinkIntoNav(html, "/start-here.html", "Start Here");

  if (html !== before) {
    fs.writeFileSync(file, html, "utf8");
    return { file, changed: true };
  }
  return { file, changed: false };
}

const targets = ["index.html", "radio-hub.html"];
let changed = 0;
for (const f of targets) {
  const r = patchFile(f);
  if (r.changed) { console.log(" + patched", f); changed++; }
}
console.log(`DONE: Start Here nav applied. changed=${changed}`);
