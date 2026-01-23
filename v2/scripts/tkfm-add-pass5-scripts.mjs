import fs from "fs";
const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts["pass5"] = "bash scripts/tkfm-pass5-run.sh";
pkg.scripts["dist:smoke"] = "node scripts/tkfm-dist-smoke.mjs --port 9090";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("DONE: added scripts pass5, dist:smoke");
