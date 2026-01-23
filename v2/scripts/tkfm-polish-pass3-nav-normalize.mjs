// Pass 3: normalize internal HTML navigation to absolute /page.html (prevents relative routing weirdness)
import fs from "fs";

const ROOT = process.cwd();
const isHtml = (f) => f.toLowerCase().endsWith(".html");
const files = fs.readdirSync(ROOT).filter(isHtml);

function fixAttr(html, attr) {
  // matches attr="value" or attr='value'
  const re = new RegExp(`${attr}\\s*=\\s*("([^"]+)"|'([^']+)')`, "gi");
  return html.replace(re, (m, q, v1, v2) => {
    const val = v1 || v2 || "";
    const quote = q[0] === '"' ? '"' : "'";
    // ignore external / mailto / tel / anchors / empty
    if (!val || val.startsWith("#")) return m;
    if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("mailto:") || val.startsWith("tel:")) return m;
    // only normalize .html links
    if (!val.toLowerCase().endsWith(".html")) return m;
    // already absolute
    if (val.startsWith("/")) return m;
    // normalize
    return `${attr}=${quote}/${val}${quote}`;
  });
}

let changed = 0;

for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  const before = html;

  html = fixAttr(html, "href");
  html = fixAttr(html, "action");

  if (html !== before) {
    fs.writeFileSync(f, html, "utf8");
    changed++;
  }
}

console.log(`DONE: Pass 3 nav normalize — updated ${changed} HTML file(s).`);
