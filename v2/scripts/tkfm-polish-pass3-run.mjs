// Pass 3: one command runner (cleanup + nav normalize + health scan)
import { spawnSync } from "node:child_process";

function run(cmd) {
  const r = spawnSync(process.execPath, cmd, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(["scripts/tkfm-polish-pass3-cleanup.mjs"]);
run(["scripts/tkfm-polish-pass3-nav-normalize.mjs"]);
run(["scripts/tkfm-html-health-scan.mjs"]);

console.log("DONE: Pass 3 runner finished.");
