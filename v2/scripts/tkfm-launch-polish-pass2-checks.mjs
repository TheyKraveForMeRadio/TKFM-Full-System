// Quick local checks for Launch Polish V2
import fs from "fs";

const must = [
  "js/tkfm-launch-polish.js",
  "status.html",
];

let ok = true;
for (const f of must) {
  if (!fs.existsSync(f)) {
    console.log("MISSING:", f);
    ok = false;
  }
}
if (!ok) process.exit(2);

const js = fs.readFileSync("js/tkfm-launch-polish.js", "utf8");
if (!js.includes("TKFM Launch Polish (V2)")) {
  console.log("WARN: tkfm-launch-polish.js does not look like V2");
  process.exit(1);
}

console.log("OK: Launch Polish V2 files present.");
