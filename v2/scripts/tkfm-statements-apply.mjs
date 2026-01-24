import fs from "fs";

function patchClientVault(){
  const file = "client-vault.html";
  if(!fs.existsSync(file)) return {file, changed:false};
  let html = fs.readFileSync(file, "utf8");
  if(html.includes("/royalty-statements.html")) return {file, changed:false};

  const block = `
<section class="glass card" style="margin-top:14px">
  <div class="k">Statements</div>
  <div class="h1" style="font-size:28px;margin-top:10px">Royalties + Payouts</div>
  <p class="p">View your statement lines and payout status.</p>
  <div class="divider"></div>
  <div class="row">
    <a class="btn btnHot" href="/royalty-statements.html">Open Statements</a>
    <a class="btn" href="/distribution-engine.html">Distribution</a>
    <a class="btn" href="/start-here.html">Start Here</a>
  </div>
</section>
`.trim();

  if(html.includes("</main>")){
    html = html.replace("</main>", block + "\n</main>");
    fs.writeFileSync(file, html, "utf8");
    return {file, changed:true};
  }
  return {file, changed:false};
}

const a = patchClientVault();
console.log("DONE: statements apply");
console.log(" -", a.file, a.changed ? "patched" : "no change");
