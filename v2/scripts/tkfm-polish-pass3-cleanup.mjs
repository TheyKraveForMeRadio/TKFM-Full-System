// Pass 3: cleanup duplicate tkfm-launch-polish tags + normalize to one include
import fs from "fs";

const ROOT = process.cwd();
const isHtml = (f) => f.toLowerCase().endsWith(".html");

const files = fs.readdirSync(ROOT).filter(isHtml);
let changed = 0;

for (const f of files) {
  let html = fs.readFileSync(f, "utf8");

  const re = /<script\s+type=["']module["']\s+src=["']\/js\/tkfm-launch-polish\.js["']\s*><\/script>\s*/gi;
  const matches = html.match(re) || [];

  if (matches.length > 1) {
    html = html.replace(re, "");
    if (html.includes("</body>")) {
      html = html.replace("</body>", `  <script type="module" src="/js/tkfm-launch-polish.js"></script>\n</body>`);
      fs.writeFileSync(f, html, "utf8");
      changed++;
    }
  }
}

console.log(`DONE: Pass 3 cleanup — deduped launch polish tags on ${changed} file(s).`);
