import fs from "fs";

function patchClientVault(){
  const file = "client-vault.html";
  if(!fs.existsSync(file)) return {file, changed:false, reason:"missing"};
  let html = fs.readFileSync(file, "utf8");
  let changed = false;

  if(!html.includes('id="tkfmMyReleases"')){
    const block = `
<section class="glass card" style="margin-top:14px">
  <div class="k">My Releases</div>
  <div class="h1" style="font-size:28px;margin-top:10px">Distribution Inbox</div>
  <p class="p">Enter your email to load your Distribution requests and open your landing pages.</p>
  <div class="divider"></div>
  <div class="row">
    <input class="input" id="tkfmReleasesEmail" placeholder="you@email.com" style="min-width:260px"/>
    <button class="btn btnHot" id="tkfmReleasesLoad" type="button">Load My Releases</button>
    <a class="btn" href="/distribution-engine.html">Submit a Release</a>
  </div>
  <div id="tkfmMyReleases" style="margin-top:10px"></div>
</section>
`.trim();

    if(html.includes("</main>")){
      html = html.replace("</main>", block + "\n</main>");
      changed = true;
    } else if(html.includes("</body>")){
      html = html.replace("</body>", block + "\n</body>");
      changed = true;
    }
  }

  if(!html.includes("/js/tkfm-distribution-my-releases.js") && html.includes("</body>")){
    html = html.replace("</body>", `  <script type="module" src="/js/tkfm-distribution-my-releases.js"></script>\n</body>`);
    changed = true;
  }

  if(changed) fs.writeFileSync(file, html, "utf8");
  return {file, changed};
}

function patchStartHere(){
  const file = "start-here.html";
  if(!fs.existsSync(file)) return {file, changed:false};
  let html = fs.readFileSync(file, "utf8");
  let changed = false;
  if(!html.includes("/distribution-engine.html")){
    // no-op (it should already)
  }
  if(changed) fs.writeFileSync(file, html, "utf8");
  return {file, changed};
}

const a = patchClientVault();
patchStartHere();

console.log("DONE: distribution v2 apply");
console.log(" -", a.file, a.changed ? "patched" : "no change");
