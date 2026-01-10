#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Safe Paid-Lane Modal Injector (NO page wipe) =="
echo "What this does:"
echo " - Adds/replaces ONE marked modal block + ONE marked style block"
echo " - Does NOT touch any other markup (prevents blank pages)"
echo

FILES=(
  "video-engine.html"
  "podcast-engine.html"
  "press-engine.html"
  "social-engine.html"
  "pricing.html"
)

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/paid-lane-safe-inject-$STAMP"
mkdir -p "$BK"

STYLE_BLOCK='<!-- TKFM_PAID_LANE_MODAL_STYLES_START -->
<style id="tkfmPaidLaneModalStyles">
#tkfmPaidLaneModal{display:none;position:fixed;inset:0;z-index:99999}
#tkfmPaidLaneModal[data-open="1"]{display:block;}
#tkfmPaidLaneModalOverlay{position:absolute; inset:0; background:rgba(2,6,23,.72);}
#tkfmPaidLaneModalCard{
  position:relative;
  width:min(720px, calc(100% - 24px));
  margin: min(8vh, 72px) auto 0 auto;
  border-radius:20px;
  background:linear-gradient(180deg, rgba(2,6,23,.98), rgba(2,6,23,.92));
  border:1px solid rgba(34,211,238,.35);
  box-shadow:0 30px 120px rgba(0,0,0,.55);
  color:#e2e8f0;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  overflow:hidden;
}
#tkfmPaidLaneModalTop{padding:14px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(34,211,238,.18);}
#tkfmPaidLaneBadge{
  width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(90deg, rgba(168,85,247,.35), rgba(236,72,153,.25));
  border:1px solid rgba(168,85,247,.35); font-weight:900;
}
#tkfmPaidLanePlanPill{
  font-size:12px; opacity:.9; padding:6px 10px; border-radius:999px;
  border:1px solid rgba(250,204,21,.25);
  background:rgba(250,204,21,.08);
  color:#fde68a;
  white-space:nowrap;
}
#tkfmPaidLaneBody{padding:16px;}
.tkfmPLField{display:flex; flex-direction:column; gap:6px; margin-bottom:12px;}
.tkfmPLField label{font-size:12px; opacity:.85;}
.tkfmPLField input,.tkfmPLField textarea{
  width:100%; padding:10px 12px; border-radius:14px;
  border:1px solid rgba(34,211,238,.22);
  background:rgba(15,23,42,.55);
  color:#e2e8f0; outline:none;
}
.tkfmPLField input:focus,.tkfmPLField textarea:focus{border-color:rgba(34,211,238,.55)}
#tkfmPaidLaneActions{display:flex; gap:10px; align-items:center; justify-content:flex-end; padding:14px 16px; border-top:1px solid rgba(34,211,238,.18);}
.tkfmBtn{border:1px solid rgba(34,211,238,.35); background:rgba(2,6,23,.65); color:#e2e8f0; padding:10px 14px; border-radius:14px; cursor:pointer; font-weight:800;}
.tkfmBtnHot{background:linear-gradient(90deg, rgba(168,85,247,.35), rgba(236,72,153,.25)); border-color:rgba(168,85,247,.35);}
.tkfmBtnGold{background:linear-gradient(90deg, rgba(250,204,21,.20), rgba(249,115,22,.12)); border-color:rgba(250,204,21,.30); color:#fff7ed;}
#tkfmPaidLane_status{font-size:12px; opacity:.9; margin-top:8px;}
#tkfmPaidLane_next{display:none; margin-top:10px; padding:10px 12px; border-radius:16px; border:1px solid rgba(59,130,246,.25); background:rgba(59,130,246,.10);}
#tkfmPaidLane_next a{color:#93c5fd; font-weight:800; text-decoration:none;}
</style>
<!-- TKFM_PAID_LANE_MODAL_STYLES_END -->'

MODAL_BLOCK='<!-- TKFM_PAID_LANE_MODAL_START -->
<div id="tkfmPaidLaneModal" aria-hidden="true">
  <div id="tkfmPaidLaneModalOverlay" data-close="1"></div>
  <div id="tkfmPaidLaneModalCard" role="dialog" aria-modal="true" aria-labelledby="tkfmPaidLaneTitle">
    <div id="tkfmPaidLaneModalTop">
      <div style="display:flex;gap:12px;align-items:center">
        <div id="tkfmPaidLaneBadge">TKFM</div>
        <div>
          <div id="tkfmPaidLaneTitle" style="font-weight:900;letter-spacing:.06em">Paid Lane Submission</div>
          <div style="font-size:12px;opacity:.85">Submit instantly after purchase — feeds Featured + Autopilot.</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <div id="tkfmPaidLanePlanPill">Lane: <span id="tkfmPaidLanePlanLabel">Not set</span></div>
        <button class="tkfmBtn" type="button" data-close="1">Close</button>
      </div>
    </div>

    <div id="tkfmPaidLaneBody">
      <div class="tkfmPLField">
        <label for="tkfmPaidLane_title">Title</label>
        <input id="tkfmPaidLane_title" type="text" placeholder="Project / Track / Campaign title" />
      </div>

      <div class="tkfmPLField">
        <label for="tkfmPaidLane_link">Link</label>
        <input id="tkfmPaidLane_link" type="url" placeholder="https:// (YouTube, SoundCloud, Drive, Dropbox, Press link...)" />
      </div>

      <div class="tkfmPLField">
        <label for="tkfmPaidLane_contact">Contact</label>
        <input id="tkfmPaidLane_contact" type="text" placeholder="Email / IG / Phone (so we can follow up)" />
      </div>

      <div class="tkfmPLField">
        <label for="tkfmPaidLane_notes">Notes</label>
        <textarea id="tkfmPaidLane_notes" rows="4" placeholder="Any details you want TKFM to follow..."></textarea>
      </div>

      <div id="tkfmPaidLane_status"></div>
      <div id="tkfmPaidLane_next">Next step: <a id="tkfmPaidLane_nextLink" href="#">Go to your lane</a></div>
    </div>

    <div id="tkfmPaidLaneActions">
      <button class="tkfmBtnGold" id="tkfmPaidLane_submit" type="button">Submit Now</button>
    </div>
  </div>
</div>
<!-- TKFM_PAID_LANE_MODAL_END -->'

ensure_js_include () {
  local f="$1"
  if grep -qi 'tkfm-paid-lane-submit\.js' "$f"; then
    return 0
  fi
  # insert before </body> if present, else append
  if grep -qi '</body>' "$f"; then
    perl -0777 -i -pe 's#</body>#  <script src="/js/tkfm-paid-lane-submit.js"></script>\n</body>#i' "$f"
  else
    printf '\n<script src="/js/tkfm-paid-lane-submit.js"></script>\n' >> "$f"
  fi
}

replace_marked_block () {
  local f="$1"
  local start="$2"
  local end="$3"
  local block="$4"

  # If old marked block exists, delete it
  if grep -q "$start" "$f"; then
    # delete from start marker line to end marker line (inclusive)
    perl -i -ne '
      if (index($_, $ENV{"S"}) >= 0) { $in=1; next; }
      if ($in && index($_, $ENV{"E"}) >= 0) { $in=0; next; }
      print unless $in;
    ' "$f" S="$start" E="$end"
  fi

  # Insert fresh block
  if grep -qi '</head>' "$f" && [[ "$start" == "<!-- TKFM_PAID_LANE_MODAL_STYLES_START -->" ]]; then
    perl -0777 -i -pe 's#</head>#'"$block"'\n</head>#i' "$f"
  elif grep -qi '</body>' "$f" && [[ "$start" == "<!-- TKFM_PAID_LANE_MODAL_START -->" ]]; then
    perl -0777 -i -pe 's#</body>#'"$block"'\n</body>#i' "$f"
  else
    printf '\n%s\n' "$block" >> "$f"
  fi
}

for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue

  cp -p "$f" "$BK/$f"

  # Hard safety: refuse to run if file is tiny (likely already wiped)
  lines="$(wc -l < "$f" | tr -d ' ')"
  if [ "${lines:-0}" -lt 40 ]; then
    echo "SKIP (file too small, restore first): $f  (lines=$lines)"
    continue
  fi

  # Styles in head
  replace_marked_block "$f" "<!-- TKFM_PAID_LANE_MODAL_STYLES_START -->" "<!-- TKFM_PAID_LANE_MODAL_STYLES_END -->" "$STYLE_BLOCK"

  # Modal in body
  replace_marked_block "$f" "<!-- TKFM_PAID_LANE_MODAL_START -->" "<!-- TKFM_PAID_LANE_MODAL_END -->" "$MODAL_BLOCK"

  # Ensure JS loader
  ensure_js_include "$f"

  echo "PATCHED: $f"
done

echo
echo "✅ Safe modal inject complete."
echo "Backup dir: $BK"
