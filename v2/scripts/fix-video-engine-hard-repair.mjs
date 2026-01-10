#!/usr/bin/env node
import fs from "fs";

const F = "video-engine.html";
if (!fs.existsSync(F)) {
  console.error("FAIL: video-engine.html not found");
  process.exit(1);
}
const stamp = new Date().toISOString().replace(/[-:]/g,"").slice(0,15);
const bkDir = `backups/video-engine-hard-repair-${stamp}`;
fs.mkdirSync(bkDir, { recursive: true });
fs.copyFileSync(F, `${bkDir}/${F}`);

const themeCss = fs.readFileSync("scripts/__tkfm_video_engine_theme.css", "utf8").trimEnd();
const modalCss = fs.readFileSync("scripts/__tkfm_paid_lane_modal_styles.css", "utf8").trimEnd();

let src = fs.readFileSync(F, "utf8");

// Normalize line endings
src = src.replace(/\r\n/g, "\n");

// Remove existing theme style block by id
src = src.replace(/<style[^>]*id=["']tkfmVideoEngineTheme["'][^>]*>[\s\S]*?<\/style>\s*/gi, "");

// Remove existing modal style block by id
src = src.replace(/<style[^>]*id=["']tkfmPaidLaneModalStyles["'][^>]*>[\s\S]*?<\/style>\s*/gi, "");

// Remove existing modal markers block
src = src.replace(/<!--\s*TKFM_PAID_LANE_MODAL_STYLES_START\s*-->[\s\S]*?<!--\s*TKFM_PAID_LANE_MODAL_STYLES_END\s*-->\s*/gi, "");

// Remove raw pasted modal css lines OUTSIDE style: we'll do a pass with style depth tracking
const lines = src.split("\n");
let out = [];
let styleDepth = 0;

const isStyleOpen = (l) => /<style\b[^>]*>/i.test(l);
const isStyleClose = (l) => /<\/style>/i.test(l);

for (let i=0;i<lines.length;i++){
  const l = lines[i];

  if (isStyleOpen(l)) {
    styleDepth++;
    out.push(l);
    continue;
  }
  if (isStyleClose(l)) {
    if (styleDepth>0) {
      styleDepth--;
      out.push(l);
    } else {
      // stray close outside style
      continue;
    }
    continue;
  }

  if (styleDepth===0) {
    // Strip the known stray blob lines if they are in visible markup
    if (l.includes('#tkfmPaidLaneModal[data-open="1"]{display:block;}')) continue;
    if (l.includes("background:#020617; background-image: radial-gradient")) continue;
    if (/^\s*#tkfmPaidLaneModal/i.test(l)) continue;
    if (/^\s*#tkfmPaidLaneModalOverlay/i.test(l)) continue;
    if (/^\s*#tkfmPaidLaneModalCard/i.test(l)) continue;
    if (/^\s*#tkfmPaidLaneModalTop/i.test(l)) continue;
    if (/^\s*#tkfmPaidLaneBadge/i.test(l)) continue;
    if (/^\s*#tkfmPaidLanePlanPill/i.test(l)) continue;
  }

  out.push(l);
}

src = out.join("\n");

// Extract and remove any <body ...> and </body>
let bodyOpen = "<body>";
const bodyOpenMatch = src.match(/<body\b[^>]*>/i);
if (bodyOpenMatch) bodyOpen = bodyOpenMatch[0];

src = src.replace(/<body\b[^>]*>\s*/gi, "");
src = src.replace(/\s*<\/body>\s*/gi, "");

// Ensure we have <head> and close it BEFORE content
// If </head> is missing or content leaks into head, we close it at the first content boundary.
let parts = src.split("\n");

// Find <head> start
let headStart = parts.findIndex(l => /<head\b/i.test(l));
if (headStart === -1) {
  // Insert head after <html ...>
  const htmlIdx = parts.findIndex(l => /<html\b/i.test(l));
  const insertAt = htmlIdx >= 0 ? htmlIdx+1 : 0;
  parts.splice(insertAt, 0, "<head>");
  headStart = insertAt;
}

// Find first </head>
let headEnd = parts.findIndex(l => /<\/head>/i.test(l));

// Determine boundary: first line that looks like body content (section/main/header/footer/nav) OR </html> OR end
const boundaryIdx = (() => {
  const re = /<(section|main|header|footer|nav)\b/i;
  const divRe = /<div\b/i;
  const bodyRe = /<body\b/i;
  for (let i=0;i<parts.length;i++){
    if (i<=headStart) continue;
    if (bodyRe.test(parts[i])) return i;
    if (re.test(parts[i])) return i;
    // if we see a big content section container div, treat as boundary too
    if (divRe.test(parts[i]) && parts[i].toLowerCase().includes("tkfm")) return i;
  }
  const htmlClose = parts.findIndex(l => /<\/html>/i.test(l));
  return htmlClose >= 0 ? htmlClose : parts.length;
})();

if (headEnd === -1 || headEnd > boundaryIdx) {
  // Remove any existing </head> that appears too late
  if (headEnd !== -1) {
    parts.splice(headEnd, 1);
  }
  // Insert </head> at boundary
  parts.splice(boundaryIdx, 0, "</head>");
  headEnd = boundaryIdx;
}

// Inject clean styles just before </head>
const styleBlock = [
  '  <style id="tkfmVideoEngineTheme">',
  themeCss,
  "  </style>",
  "",
  "  <!-- TKFM_PAID_LANE_MODAL_STYLES_START -->",
  '  <style id="tkfmPaidLaneModalStyles">',
  modalCss,
  "  </style>",
  "  <!-- TKFM_PAID_LANE_MODAL_STYLES_END -->"
];

// Insert only if not already present (we removed earlier), so always insert now.
parts.splice(headEnd, 0, ...styleBlock);
headEnd += styleBlock.length;

// Ensure body open right after </head>
const headEndLine = parts.findIndex(l => /<\/head>/i.test(l));
const bodyInsertAt = headEndLine >= 0 ? headEndLine + 1 : parts.length;
parts.splice(bodyInsertAt, 0, bodyOpen);

// Ensure </html> exists; if missing append
let htmlCloseIdx = parts.findIndex(l => /<\/html>/i.test(l));
if (htmlCloseIdx === -1) {
  parts.push("</body>");
  parts.push("</html>");
} else {
  // ensure </body> before </html>
  // remove any extra </body> already present (we stripped above) so just insert
  parts.splice(htmlCloseIdx, 0, "</body>");
}

// Finally, remove any nested <style> inside any <style> by brute force: if <style> appears while styleDepth>0, drop that line.
let cleaned = [];
let sd=0;
for (const l of parts){
  if (/<style\b/i.test(l)) {
    if (sd>0) continue;
    sd++;
    cleaned.push(l);
    continue;
  }
  if (/<\/style>/i.test(l)) {
    if (sd>0){ sd--; cleaned.push(l); }
    else continue;
    continue;
  }
  cleaned.push(l);
}

let finalSrc = cleaned.join("\n");

// Balance stray </style> again (just in case)
{
  const ls = finalSrc.split("\n");
  let bal = 0;
  const oo = [];
  for (const l of ls){
    if (/<style\b/i.test(l)) { bal++; oo.push(l); continue; }
    if (/<\/style>/i.test(l)) { if (bal>0){ bal--; oo.push(l); } else { continue; } continue; }
    oo.push(l);
  }
  finalSrc = oo.join("\n");
}

fs.writeFileSync(F, finalSrc, "utf8");
console.log("OK: hard repaired video-engine.html");
console.log("Backup:", `${bkDir}/${F}`);
