#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Add PRO Paid-Lane CTA Bar (Buy → Submit) on all engine pages =="
echo "This inserts a safe CTA bar right after <body> on each engine page."
echo

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/engine-cta-bars-$STAMP"
mkdir -p "$BK"

PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html)

CTA_STYLE_TAG='  <style id="tkfmPaidLaneCtaBarStyles">
  .tkfmCtaWrap{max-width:1200px;margin:14px auto 10px;padding:14px;border-radius:22px;background:rgba(2,6,23,.55);border:1px solid rgba(148,163,184,.18);box-shadow:0 20px 80px rgba(0,0,0,.35);color:#e2e8f0}
  .tkfmCtaTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .tkfmCtaPill{font-size:.7rem;letter-spacing:.28em;text-transform:uppercase;color:rgba(34,211,238,.95)}
  .tkfmCtaH{margin:8px 0 6px;font-weight:900;letter-spacing:.2px;font-size:1.1rem}
  .tkfmCtaCopy{color:rgba(226,232,240,.78);line-height:1.55;max-width:820px}
  .tkfmCtaBtns{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .tkfmCtaBtn{border-radius:999px;font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;font-weight:900;padding:.75rem 1.05rem;white-space:nowrap;border:1px solid rgba(34,211,238,.35);background:rgba(2,6,23,.65);color:#e2e8f0;cursor:pointer}
  .tkfmCtaBtn:hover{border-color:rgba(34,211,238,.55)}
  .tkfmCtaBtnHot{background:linear-gradient(90deg, rgba(168,85,247,.35), rgba(236,72,153,.25));border-color:rgba(168,85,247,.35)}
  .tkfmCtaBtnGold{background:linear-gradient(90deg, rgba(250,204,21,.18), rgba(249,115,22,.10));border-color:rgba(250,204,21,.30);color:#fff7ed}
  .tkfmCtaMini{margin-top:10px;display:flex;gap:12px;flex-wrap:wrap;color:rgba(226,232,240,.68);font-size:.85rem}
  .tkfmCtaLink{color:rgba(147,197,253,.95);font-weight:900;text-decoration:none}
  </style>'

CTA_BLOCK_START='<!-- TKFM: ENGINE CTA BAR START (safe) -->'
CTA_BLOCK_END='<!-- TKFM: ENGINE CTA BAR END (safe) -->'

for f in "${PAGES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP missing: $f"
    continue
  fi

  cp -p "$f" "$BK/$f"

  # Find a default planId already used on the page (avoid guessing / broken buttons)
  DEFAULT_PLAN="$(grep -oE 'data-plan="[^"]+"' "$f" | head -n1 | sed 's/^data-plan="//; s/"$//' || true)"
  if [ -z "${DEFAULT_PLAN:-}" ]; then
    echo "WARN: no data-plan found in $f (not adding CTA)."
    continue
  fi

  # Ensure CTA styles exist in <head>
  if ! grep -qi 'tkfmPaidLaneCtaBarStyles' "$f"; then
    awk -v INS="$CTA_STYLE_TAG" '
      BEGIN{done=0}
      {
        if(!done && tolower($0) ~ /<\/head>/){ print INS; done=1; }
        print $0;
      }
    ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
  fi

  # Remove old CTA block if present (idempotent)
  awk '
    BEGIN{skip=0}
    /TKFM: ENGINE CTA BAR START/ {skip=1; next}
    /TKFM: ENGINE CTA BAR END/ {skip=0; next}
    skip==0 {print}
  ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"

  # Insert CTA block right after <body ...>
  awk -v PLAN="$DEFAULT_PLAN" -v START="$CTA_BLOCK_START" -v END="$CTA_BLOCK_END" '
    BEGIN{inserted=0}
    {
      print $0
      if(!inserted && tolower($0) ~ /<body[^>]*>/){
        inserted=1
        print START
        print "<section class=\"tkfmCtaWrap\" role=\"region\" aria-label=\"TKFM Paid Lane\">"
        print "  <div class=\"tkfmCtaTop\">"
        print "    <div>"
        print "      <div class=\"tkfmCtaPill\">PAID LANE • SUBMIT AFTER PURCHASE</div>"
        print "      <div class=\"tkfmCtaH\">Buy the lane, submit your link, and we push it through the TKFM pipeline.</div>"
        print "      <div class=\"tkfmCtaCopy\">"
        print "        This is a paid placement lane. After checkout, you’ll be routed back here to submit instantly — your submission feeds <strong>Featured</strong> and <strong>Autopilot scheduling</strong>."
        print "      </div>"
        print "    </div>"
        print "    <div class=\"tkfmCtaBtns\">"
        print "      <button class=\"tkfmCtaBtn tkfmCtaBtnHot js-checkout\" data-plan=\"" PLAN "\">Buy This Lane</button>"
        print "      <a class=\"tkfmCtaBtn tkfmCtaBtnGold\" href=\"" FILENAME "?submit=1&lane=" PLAN "\">Submit Now</a>"
        print "      <a class=\"tkfmCtaBtn\" href=\"/pricing.html\">See All Pricing</a>"
        print "    </div>"
        print "  </div>"
        print "  <div class=\"tkfmCtaMini\">"
        print "    <span>Fast path:</span>"
        print "    <span><strong>Checkout → Post-Checkout → Auto-Submit</strong></span>"
        print "    <span>Lane ID: <code style=\"opacity:.9\">" PLAN "</code></span>"
        print "  </div>"
        print "</section>"
        print END
      }
    }
  ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"

  echo "OK: $f (default lane: $DEFAULT_PLAN)"
done

echo
echo "DONE."
echo "Backups: $BK"
