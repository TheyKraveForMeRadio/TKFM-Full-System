// Apply Launch Alerts CTA script tag to key pages
import fs from "fs";

const TARGETS = ["index.html","start-here.html","radio-hub.html","pricing.html"];
const TAG = `<script type="module" src="/js/tkfm-launch-alerts-cta.js"></script>`;

let changed = 0;

for (const f of TARGETS) {
  if (!fs.existsSync(f)) continue;
  let html = fs.readFileSync(f, "utf8");
  if (html.includes("/js/tkfm-launch-alerts-cta.js")) continue;
  if (!html.includes("</body>")) continue;
  html = html.replace("</body>", `  ${TAG}\n</body>`);
  fs.writeFileSync(f, html, "utf8");
  console.log(" + patched", f);
  changed++;
}

console.log("DONE: alerts CTA apply. changed=" + changed);
