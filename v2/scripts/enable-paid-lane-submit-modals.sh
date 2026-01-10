#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Enable paid-lane submit modals on key engine pages (SAFE INSTALLER) =="
STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/paid-lane-submit-modals-$STAMP"
mkdir -p "$BK"
mkdir -p js

if [ ! -f "js/tkfm-paid-lane-submit.js" ]; then
  echo "FAIL: js/tkfm-paid-lane-submit.js missing. Unzip the submit-modals patch first."
  exit 1
fi

# Pages to patch
PAGES=(
  "video-engine.html"
  "podcast-engine.html"
  "press-engine.html"
  "social-engine.html"
  "pricing.html"
)

backup_once() {
  local f="$1"
  local b="$BK/$(basename "$f")"
  if [ -f "$f" ] && [ ! -f "$b" ]; then
    cp -p "$f" "$b"
  fi
}

inject_before_tag() {
  local f="$1"
  local tag="$2"
  local needle="$3"
  local insert_file="$4"

  if ! grep -qi "$needle" "$f"; then
    backup_once "$f"
    local tmp
    tmp="$(mktemp)"
    awk -v TAG="$tag" -v INS="$insert_file" '
      BEGIN{done=0}
      {
        if (!done && tolower($0) ~ tolower(TAG)) {
          # print inserted block
          while ((getline line < INS) > 0) print line
          close(INS)
          done=1
        }
        print $0
      }
    ' "$f" > "$tmp"
    mv "$tmp" "$f"
    return 0
  fi
  return 1
}

inject_after_body_open() {
  local f="$1"
  if ! grep -qi 'id="tkfmPaidLaneSubmitHost"' "$f"; then
    backup_once "$f"
    local tmp
    tmp="$(mktemp)"
    awk '
      BEGIN{done=0}
      {
        print $0
        if (!done && $0 ~ /<body[^>]*>/i) {
          print "  <div id=\"tkfmPaidLaneSubmitHost\" style=\"padding:12px 16px; max-width:1100px; margin:0 auto;\"></div>"
          done=1
        }
      }
    ' "$f" > "$tmp"
    mv "$tmp" "$f"
    echo "HOST: added to $f"
  fi
}

# Build insertion snippets
HEAD_SNIP="$(mktemp)"
cat > "$HEAD_SNIP" <<'HTML'
  <script src="/js/tkfm-paid-lane-submit.js"></script>
HTML

MODAL_BLOCK="$(mktemp)"
cat > "$MODAL_BLOCK" <<'HTML'
  <!-- TKFM Paid Lane Submit Modal -->
  <style id="tkfmPaidLaneModalStyles">
    #tkfmPaidLaneModal{display:none; position:fixed; inset:0; z-index:999999;}
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
      width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center;
      background:linear-gradient(90deg, rgba(168,85,247,.35), rgba(236,72,153,.25));
      border:1px solid rgba(168,85,247,.35);
      font-weight:900;
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
      width:100%;
      padding:10px 12px;
      border-radius:14px;
      border:1px solid rgba(34,211,238,.22);
      background:rgba(15,23,42,.55);
      color:#e2e8f0;
      outline:none;
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

  <div id="tkfmPaidLaneModal" aria-hidden="true">
    <div id="tkfmPaidLaneModalOverlay" data-tkfm-modal-close="1"></div>
    <div id="tkfmPaidLaneModalCard" role="dialog" aria-modal="true" aria-label="Paid Lane Submission">
      <div id="tkfmPaidLaneModalTop">
        <div style="display:flex; align-items:center; gap:10px;">
          <div id="tkfmPaidLaneBadge">TKFM</div>
          <div>
            <div style="font-weight:900; font-size:16px; letter-spacing:.3px;">Paid Lane Submission</div>
            <div style="font-size:12px; opacity:.8;">Submit instantly after purchase — feeds Featured + Autopilot.</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <div id="tkfmPaidLanePlanPill">Lane: (not set)</div>
          <button class="tkfmBtn" type="button" data-tkfm-modal-close="1" aria-label="Close">Close</button>
        </div>
      </div>

      <div id="tkfmPaidLaneBody">
        <input id="tkfmPaidLane_planId" type="hidden" value="" />

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

        <div id="tkfmPaidLane_next">
          Next step: <a id="tkfmPaidLane_go" href="/pricing.html">Go to your lane</a>
        </div>
      </div>

      <div id="tkfmPaidLaneActions">
        <button class="tkfmBtnGold tkfmBtn" type="button" id="tkfmPaidLane_submit">Submit Now</button>
      </div>
    </div>
  </div>
HTML

inject_modal_before_body_close() {
  local f="$1"
  if ! grep -qi 'id="tkfmPaidLaneModal"' "$f"; then
    backup_once "$f"
    local tmp
    tmp="$(mktemp)"
    awk -v INS="$MODAL_BLOCK" '
      BEGIN{done=0}
      {
        if (!done && $0 ~ /<\/body>/i) {
          while ((getline line < INS) > 0) print line
          close(INS)
          done=1
        }
        print $0
      }
    ' "$f" > "$tmp"
    mv "$tmp" "$f"
    echo "MODAL: injected into $f"
  fi
}

inject_head_script() {
  local f="$1"
  if ! grep -qi 'tkfm-paid-lane-submit\.js' "$f"; then
    backup_once "$f"
    local tmp
    tmp="$(mktemp)"
    awk -v INS="$HEAD_SNIP" '
      BEGIN{done=0}
      {
        if (!done && $0 ~ /<\/head>/i) {
          while ((getline line < INS) > 0) print line
          close(INS)
          done=1
        }
        print $0
      }
    ' "$f" > "$tmp"
    mv "$tmp" "$f"
    echo "SCRIPT: injected into $f"
  fi
}

for f in "${PAGES[@]}"; do
  if [ -f "$f" ]; then
    inject_head_script "$f"
    inject_after_body_open "$f"
    inject_modal_before_body_close "$f"
  else
    echo "SKIP: $f (missing)"
  fi
done

rm -f "$HEAD_SNIP" "$MODAL_BLOCK" 2>/dev/null || true

echo
echo "Done. Backups at: $BK"
