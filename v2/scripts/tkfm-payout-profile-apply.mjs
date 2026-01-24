import fs from "fs";

function patchClientVault(){
  const file="client-vault.html";
  if(!fs.existsSync(file)) return false;
  let html=fs.readFileSync(file,"utf8");
  if(html.includes("/payout-profile.html")) return false;

  const block = `
<section class="glass card" style="margin-top:14px">
  <div class="k">Payout Profile</div>
  <div class="h1" style="font-size:28px;margin-top:10px">How you get paid</div>
  <p class="p">Set your payout method (PayPal/ACH) so TKFM can pay royalties.</p>
  <div class="divider"></div>
  <div class="row">
    <a class="btn btnHot" href="/payout-profile.html">Set Payout Profile</a>
    <a class="btn" href="/royalty-statements.html">Statements</a>
  </div>
</section>
`.trim();

  if(html.includes("</main>")){
    html = html.replace("</main>", block + "\n</main>");
    fs.writeFileSync(file, html, "utf8");
    return true;
  }
  return false;
}

function patchOwnerStatements(){
  const file="owner-statements-console.html";
  if(!fs.existsSync(file)) return false;
  let html=fs.readFileSync(file,"utf8");
  if(html.includes("/owner-payout-profiles.html")) return false;
  html = html.replace(
    /(<a class="btn" href="\/owner-distribution-ops\.html">Distribution Queue<\/a>)/,
    `$1\n        <a class="btn" href="/owner-payout-profiles.html">Payout Profiles</a>`
  );
  fs.writeFileSync(file, html, "utf8");
  return true;
}

let c=0;
if(patchClientVault()) c++;
if(patchOwnerStatements()) c++;
console.log("DONE: payout profile apply. changed="+c);
