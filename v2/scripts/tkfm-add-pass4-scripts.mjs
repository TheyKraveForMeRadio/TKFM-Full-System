import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts["dist:verify"] = "node scripts/tkfm-dist-verify.mjs";
pkg.scripts["releases:prune"] = "bash scripts/tkfm-release-prune.sh 1";
pkg.scripts["pass4"] = "bash scripts/tkfm-pass4-run.sh";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("DONE: added scripts dist:verify, releases:prune, pass4");
