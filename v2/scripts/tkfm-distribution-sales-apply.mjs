import fs from "fs";

let changed = 0;

function patchIndex(){
  const file = "index.html";
  if(!fs.existsSync(file)) return;
  let html = fs.readFileSync(file,"utf8");
  if(html.includes('href="distribution.html"') || html.includes('href="/distribution.html"')) return;
  if(html.includes('href="tkfm-catalog.html">Catalog</a>')){
    html = html.replace('href="tkfm-catalog.html">Catalog</a>', 'href="tkfm-catalog.html">Catalog</a><a class="pill" href="distribution.html">Distribution</a>');
    fs.writeFileSync(file, html, "utf8");
    changed++;
  }
}

function patchPricing(){
  const file = "pricing.html";
  if(!fs.existsSync(file)) return;
  let html = fs.readFileSync(file,"utf8");
  if(html.includes('/distribution.html')) return;
  if(html.includes('class="btnRow"')){
    html = html.replace(/(<div class="btnRow"[\s\S]*?>)/, `$1\n        <a class="btn btnHot" href="/distribution.html">Distribution</a>`);
    fs.writeFileSync(file, html, "utf8");
    changed++;
  }
}

function patchStartHere(){
  const file = "start-here.html";
  if(!fs.existsSync(file)) return;
  let html = fs.readFileSync(file,"utf8");
  if(html.includes('/distribution.html')) return;
  const btn = '<a class="btn btnHot" href="/distribution.html">Distribution</a>';
  if(html.includes('class="btnRow"')){
    html = html.replace(/(<div class="btnRow"[\s\S]*?>)/, `$1\n        ${btn}`);
    fs.writeFileSync(file, html, "utf8");
    changed++;
  }
}

function patchLabelHub(){
  const file = "label-hub.html";
  if(!fs.existsSync(file)) return;
  let html = fs.readFileSync(file,"utf8");
  if(html.includes('/distribution.html')) return;
  const needle = '<a class="pill" href="/label-hub.html">Records Hub</a>';
  if(html.includes(needle)){
    html = html.replace(needle, needle + '\n        <a class="pill" href="/distribution.html">Distribution</a>');
    fs.writeFileSync(file, html, "utf8");
    changed++;
  }
}

patchIndex();
patchPricing();
patchStartHere();
patchLabelHub();

console.log("DONE: distribution sales apply. changed=" + changed);
