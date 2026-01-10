#!/usr/bin/env node
import fs from "fs";

const F="video-engine.html";
if (!fs.existsSync(F)) { console.error("FAIL: video-engine.html not found"); process.exit(1); }

const stamp = new Date().toISOString().replace(/[-:]/g,"").slice(0,15);
const bkDir = `backups/video-engine-force-style-${stamp}`;
fs.mkdirSync(bkDir, { recursive:true });
fs.copyFileSync(F, `${bkDir}/${F}`);

const themeCss = fs.readFileSync("scripts/__tkfm_video_engine_theme.css","utf8").trimEnd();
const modalCss = fs.readFileSync("scripts/__tkfm_paid_lane_modal_styles.css","utf8").trimEnd();

let src = fs.readFileSync(F,"utf8").replace(/\r\n/g,"\n");

// 1) Remove ALL <style>...</style> blocks (anywhere in file)
src = src.replace(/<style\b[^>]*>[\s\S]*?<\/style>\s*/gi, "");

// 2) Remove stray CSS-like lines outside style that commonly get pasted (selectors / background blob)
let lines = src.split("\n");
let out = [];
for (const l of lines) {
  const t = l.trim();

  // Drop the known pasted blob lines if they appear as visible text
  if (t.includes("background:#020617; background-image: radial-gradient")) continue;

  // Drop common selector lines accidentally pasted as text
  if (/^#tkfmPaidLaneModal\b/i.test(t)) continue;
  if (/^#tkfmPaidLaneModalOverlay\b/i.test(t)) continue;
  if (/^#tkfmPaidLaneModalCard\b/i.test(t)) continue;
  if (/^#tkfmPaidLaneModalTop\b/i.test(t)) continue;
  if (/^#tkfmPaidLaneBadge\b/i.test(t)) continue;
  if (/^#tkfmPaidLanePlanPill\b/i.test(t)) continue;
  if (/^#tkfmPaidLaneBody\b/i.test(t)) continue;
  if (/^\.tkfmPLField\b/i.test(t)) continue;
  if (/^#tkfmPaidLaneActions\b/i.test(t)) continue;
  if (/^\.tkfmBtn\b/i.test(t)) continue;
  if (/^#tkfmPaidLane_status\b/i.test(t)) continue;
  if (/^#tkfmPaidLane_next\b/i.test(t)) continue;

  // Drop stray </style> if it exists as a line by itself
  if (/^<\/style>\s*$/i.test(t)) continue;

  out.push(l);
}
src = out.join("\n");

// 3) Ensure styles are injected into <head> before </head>
if (!/<\/head>/i.test(src)) {
  console.error("FAIL: </head> not found in video-engine.html");
  process.exit(1);
}

const inject = [
  '  <style id="tkfmVideoEngineTheme">',
  themeCss,
  '  </style>',
  '',
  '  <!-- TKFM_PAID_LANE_MODAL_STYLES_START -->',
  '  <style id="tkfmPaidLaneModalStyles">',
  modalCss,
  '  </style>',
  '  <!-- TKFM_PAID_LANE_MODAL_STYLES_END -->',
  ''
].join("\n");

src = src.replace(/<\/head>/i, inject + "</head>");

// 4) Final sanity: remove any nested <style> lines if something reappeared
// (Should be impossible now, but safe.)
src = src.replace(/<style\b[^>]*>\s*<style\b[^>]*>/gi, "<style>");

// Write back
fs.writeFileSync(F, src, "utf8");
console.log("OK: rebuilt ALL style blocks in video-engine.html (only 2 remain)");
console.log("Backup:", `${bkDir}/${F}`);
