// Apply Donate Float to Radio "On Air" pages (safe inserts)
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TARGETS = [
  "live.html",
  "now-playing.html",
  "radio-stream-gateway.html",
  "radio-hub.html",
  "sponsor-on-air.html"
];

const TAG = `<script type="module" src="/js/tkfm-donate-float.js"></script>`;

function patch(fp){
  if (!fs.existsSync(fp)) return { fp, ok:false, reason:"missing" };
  let html = fs.readFileSync(fp, "utf8");
  if (html.includes("/js/tkfm-donate-float.js")) return { fp, ok:true, changed:false };
  if (!html.includes("</body>")) return { fp, ok:false, reason:"no </body>" };
  html = html.replace("</body>", `  ${TAG}\n</body>`);
  fs.writeFileSync(fp, html, "utf8");
  return { fp, ok:true, changed:true };
}

let changed = 0, skipped = 0;
for (const f of TARGETS) {
  const fp = path.join(ROOT, f);
  const r = patch(fp);
  if (r.ok && r.changed) { console.log(" + patched", f); changed++; }
  else { skipped++; }
}
console.log(`DONE: donate float apply. changed=${changed} skipped=${skipped}`);
