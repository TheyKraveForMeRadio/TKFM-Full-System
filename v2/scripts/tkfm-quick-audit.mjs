import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function listRootHtml() {
  return fs.readdirSync(ROOT).filter(f => f.toLowerCase().endsWith(".html")).sort();
}

function findBrokenPublicPaths(file, text) {
  const hits = [];
  const re = /href\s*=\s*["']\/public\/[^"']+["']|src\s*=\s*["']\/public\/[^"']+["']/gi;
  let m;
  while ((m = re.exec(text)) !== null) hits.push(m[0]);
  return hits;
}

const pages = listRootHtml();
let bad = 0;

console.log("== TKFM QUICK AUDIT ==");
console.log("Root HTML pages:", pages.length);

for (const p of pages) {
  const txt = fs.readFileSync(path.join(ROOT, p), "utf8");
  const hits = findBrokenPublicPaths(p, txt);
  if (hits.length) {
    bad++;
    console.log(`WARN: ${p} contains /public/ asset paths (${hits.length})`);
  }
}

if (bad === 0) console.log("OK: no /public/ asset paths found in root HTML");
console.log("== DONE ==");
