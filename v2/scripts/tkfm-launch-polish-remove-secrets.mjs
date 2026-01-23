import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const needles = ["sk_live_", "sk_test_"];
const ignoreDirs = new Set(["node_modules", ".git", "dist", "releases"]);

function walk(dir, out) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const fp = path.join(dir, it.name);
    if (it.isDirectory()) {
      if (ignoreDirs.has(it.name)) continue;
      walk(fp, out);
    } else {
      if (fp.endsWith(".zip")) continue;
      out.push(fp);
    }
  }
}

function main() {
  const list = [];
  walk(ROOT, list);

  const hits = [];
  for (const f of list) {
    let s = "";
    try { s = fs.readFileSync(f, "utf8"); } catch { continue; }
    for (const n of needles) {
      if (s.includes(n)) hits.push({ file: path.relative(ROOT, f), needle: n });
    }
  }

  if (!hits.length) {
    console.log("OK: No Stripe secret key patterns found in repo files.");
    process.exit(0);
  }

  console.log("SECURITY WARN: Found potential Stripe keys in repo files:");
  for (const h of hits.slice(0, 200)) console.log(" -", h.file, "contains", h.needle);
  if (hits.length > 200) console.log(" ...", hits.length - 200, "more");
  console.log("\nNext: roll/rotate keys in Stripe, remove from files, and re-run this scan.");
  process.exit(2);
}

main();
