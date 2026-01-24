import fs from "fs";

const file = "owner-distribution-ops.html";
if(!fs.existsSync(file)){
  console.error("ERROR: owner-distribution-ops.html missing");
  process.exit(1);
}

let html = fs.readFileSync(file, "utf8");
if(html.includes('id="saveSplit"')){
  console.log("OK: split controls already present.");
  process.exit(0);
}

const insert = `
<div class="divider"></div>
<div class="k">Split Overrides</div>
<div class="warn" style="margin-top:10px">
  <div style="font-weight:950">Per-release split + admin fee</div>
  <div class="mini" style="margin-top:6px">Overrides default 60/40 during Statements import. Admin fee is a flat $ amount taken from the artist share per period.</div>
  <div class="grid" style="margin-top:10px">
    <div>
      <div class="k">Artist %</div>
      <input class="input" id="artistSplit" type="number" min="0" max="100" step="1" value="60"/>
    </div>
    <div>
      <div class="k">TKFM %</div>
      <input class="input" id="tkfmSplit" type="number" min="0" max="100" step="1" value="40" readonly/>
    </div>
  </div>
  <div class="grid" style="margin-top:10px">
    <div>
      <div class="k">Admin Fee (USD)</div>
      <input class="input" id="adminFee" type="number" min="0" step="0.01" value="0"/>
      <div class="mini" style="margin-top:6px">Applied during statement import: fee is deducted from artist amount (capped) and added to TKFM.</div>
    </div>
    <div style="display:flex;align-items:flex-end;justify-content:flex-end">
      <button class="btn btnHot" id="saveSplit" type="button">Save Split</button>
    </div>
  </div>
</div>
`.trim();

if(html.includes('<div class="k">Owner notes')){
  html = html.replace('<div class="divider"></div>\n\n          <div class="k">Owner notes', insert + '\n\n          <div class="divider"></div>\n\n          <div class="k">Owner notes');
  fs.writeFileSync(file, html, "utf8");
  console.log("DONE: injected split controls into owner-distribution-ops.html");
  process.exit(0);
}

if(html.includes("</main>")){
  html = html.replace("</main>", "\n" + insert + "\n</main>");
  fs.writeFileSync(file, html, "utf8");
  console.log("DONE: appended split controls (fallback).");
  process.exit(0);
}

console.log("WARN: could not patch owner-distribution-ops.html");
process.exit(2);
