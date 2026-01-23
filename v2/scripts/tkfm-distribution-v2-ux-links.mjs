import fs from "fs";

function patch(file, findRe, insert) {
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file, "utf8");
  if (html.includes(insert.trim())) return false;
  if (!findRe.test(html)) return false;
  html = html.replace(findRe, (m) => m + "\n" + insert);
  fs.writeFileSync(file, html, "utf8");
  return true;
}

let changed = 0;

// 1) Start Here: add a Distribution tile button row link if not already present
if (fs.existsSync("start-here.html")) {
  let s = fs.readFileSync("start-here.html", "utf8");
  if (!s.includes("/distribution-engine.html")) {
    // add a tile at end of grid (simple append before </section> of grid)
    const marker = /(<section class="grid"[\s\S]*?aria-label="Lane grid">)/i;
    if (marker.test(s)) {
      const tile = `
      <div class="glass tile">
        <div class="tileK">Distribution</div>
        <div class="tileH">Singles • EPs • Albums</div>
        <div class="tileP">Distribution Assist + landing page + status tracking.</div>
        <div class="btnRow">
          <a class="btn btnHot" href="/distribution-engine.html">Distribution</a>
          <a class="btn" href="/owner-distribution-ops.html">Owner Queue</a>
        </div>
      </div>`.trim();
      // insert before the closing </section> of that grid section
      const closeIdx = s.indexOf("</section>", s.search(marker));
      if (closeIdx !== -1) {
        s = s.slice(0, closeIdx) + "\n" + tile + "\n" + s.slice(closeIdx);
        fs.writeFileSync("start-here.html", s, "utf8");
        changed++;
      }
    }
  }
}

// 2) Radio Hub: add a quick lane button for Distribution under quick start if present
const distBtn = `<a class="btn btnHot" href="/distribution-engine.html">Distribution</a>`;
changed += patch(
  "radio-hub.html",
  /(<div class="btnRow">[\s\S]*?<\/div>)/i,
  distBtn
) ? 1 : 0;

// 3) Pricing page: add a small CTA link near top if it has a btn row (safe append)
const pricingBtn = `<a class="btn btnHot" href="/distribution-engine.html">Distribution</a>`;
changed += patch(
  "pricing.html",
  /(<div class="btnRow">[\s\S]*?<\/div>)/i,
  pricingBtn
) ? 1 : 0;

console.log("DONE: Distribution V2 UX links updated. changed=" + changed);
