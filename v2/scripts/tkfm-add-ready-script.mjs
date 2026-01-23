import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts.ready = "bash scripts/tkfm-ready.sh";

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("DONE: added scripts.ready");
