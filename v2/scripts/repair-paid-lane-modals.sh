#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/paid-lane-modal-repair-$STAMP"
mkdir -p "$BK"

echo "== TKFM: Repair + Reinstall Paid Lane Submission Modal =="
echo "Backup dir: $BK"
echo

TARGETS=(
  "video-engine.html"
  "podcast-engine.html"
  "press-engine.html"
  "social-engine.html"
  "pricing.html"
)

FILES=()
for f in "${TARGETS[@]}"; do
  if [ -f "$f" ]; then
    cp -p "$f" "$BK/$f"
    FILES+=("$f")
  else
    echo "SKIP missing: $f"
  fi
done

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "No target files found in $(pwd). Run from your /v2 folder."
  exit 1
fi

# Build JSON array for node
JSON="["
for i in "${!FILES[@]}"; do
  f="${FILES[$i]}"
  f="${f//\\/\\\\}"
  f="${f//\"/\\\"}"
  if [ "$i" -gt 0 ]; then JSON+=", "; fi
  JSON+="\"$f\""
done
JSON+="]"

export __FILES__="$JSON"

node <<'NODE'
import fs from "fs";

const files = JSON.parse(process.env.__FILES__ || "[]");
const modalStyle = fs.readFileSync("js/_tkfm_paid_lane_modal_style.css","utf8");
const modalHtml  = fs.readFileSync("js/_tkfm_paid_lane_modal_host.html","utf8");

function ensureOnce(s, needle, insertBefore, injection){
  if (s.includes(needle)) return s;
  const idx = s.toLowerCase().lastIndexOf(insertBefore.toLowerCase());
  if (idx === -1) return s + "\n" + injection + "\n";
  return s.slice(0, idx) + injection + "\n" + s.slice(idx);
}

function stripNearEnd(s, marker){
  const pos = s.lastIndexOf(marker);
  if (pos === -1) return s;
  // only strip if it's near the end (avoid wiping real page content)
  if (s.length - pos > 25000) return s;

  const bodyClose = s.toLowerCase().lastIndexOf("</body>");
  if (bodyClose === -1 || bodyClose < pos) {
    return s.slice(0, pos);
  }
  return s.slice(0, pos) + "\n" + s.slice(bodyClose);
}

for (const file of files){
  let s = fs.readFileSync(file, "utf8");

  // Remove any prior injected style block
  s = s.replace(/<style[^>]*id=["']tkfmPaidLaneModalStyles["'][^>]*>[\s\S]*?<\/style>\s*/gi, "");

  // Remove any modal host if injected (near end)
  s = stripNearEnd(s, 'id="tkfmPaidLaneModal"');

  // Remove raw pasted CSS block if it exists near end
  s = stripNearEnd(s, "#tkfmPaidLaneModal[data-open");

  // Ensure modal styles in <head>
  const styleBlock = `<style id="tkfmPaidLaneModalStyles">\n${modalStyle}\n</style>`;
  s = ensureOnce(s, 'id="tkfmPaidLaneModalStyles"', "</head>", styleBlock);

  // Ensure modal host near end of <body>
  s = ensureOnce(s, 'id="tkfmPaidLaneModal"', "</body>", "\n" + modalHtml + "\n");

  // Ensure JS file is loaded
  s = ensureOnce(s, '/js/tkfm-paid-lane-submit.js', "</body>", `\n<script src="/js/tkfm-paid-lane-submit.js"></script>\n`);

  fs.writeFileSync(file, s);
  console.log("FIXED:", file);
}
NODE

echo
echo "DONE. Next: run scripts/verify-paid-lane-modals.sh"
