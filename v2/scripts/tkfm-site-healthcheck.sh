#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-.}"

echo "== TKFM: SITE HEALTHCHECK (frontend wiring + common breakages) =="
echo "Base: $BASE"
echo

fail=0
warn=0

# Helper: list root html files only (avoid backups/ noise)
root_html_list() {
  find "$BASE" -maxdepth 1 -type f -name "*.html" -print
}

# 1) Quick checkout inclusion coverage (any ROOT page with data-plan/data-feature/js-checkout should load tkfm-quick-checkout.js)
echo "-- CHECK: ROOT pages with checkout attrs but missing /js/tkfm-quick-checkout.js --"
missing=0
while IFS= read -r f; do
  rel="${f#"$BASE"/}"
  if grep -qiE 'data-plan=|data-feature=|js-checkout' "$f"; then
    if ! grep -qiE 'tkfm-quick-checkout\.js' "$f"; then
      echo "MISSING: $rel"
      missing=$((missing+1))
    fi
  fi
done < <(root_html_list)
if [ "$missing" -gt 0 ]; then
  fail=$((fail+1))
  echo "FAIL: $missing root HTML page(s) missing tkfm-quick-checkout.js"
else
  echo "OK: coverage good"
fi
echo

# 2) No visible CSS blob pasted into body (common symptom: .card{background:rgba(2,6,23,.55) shows on page)
echo "-- CHECK: visible CSS blob text likely pasted into markup (ROOT only) --"
blob=0
while IFS= read -r f; do
  [ -f "$f" ] || continue
  if grep -q '\.card{background:rgba(2,6,23' "$f"; then
    total=$(grep -o '\.card{background:rgba(2,6,23' "$f" | wc -l | tr -d ' ')
    inside=$(awk '
      BEGIN{inStyle=0; c=0}
      tolower($0) ~ /<style/{inStyle=1}
      inStyle==1 && $0 ~ /\.card\{background:rgba\(2,6,23/{c++}
      tolower($0) ~ /<\/style>/{inStyle=0}
      END{print c}
    ' "$f" | tr -d ' ')
    if [ "$inside" -lt "$total" ]; then
      rel="${f#"$BASE"/}"
      echo "POSSIBLE VISIBLE CSS BLOB: $rel  (total=$total inside_style=$inside)"
      blob=$((blob+1))
    fi
  fi
done < <(root_html_list)

if [ "$blob" -gt 0 ]; then
  fail=$((fail+1))
  echo "FAIL: $blob root page(s) look like they have CSS pasted into visible markup"
else
  echo "OK: no visible CSS blob detected"
fi
echo

# 3) Debug "Fix applied" text should NOT be visible (ROOT only)
echo "-- CHECK: debug text 'Fix applied' (ROOT only) --"
dbg_files=()
while IFS= read -r f; do
  if grep -q "Fix applied" "$f"; then
    dbg_files+=("${f#"$BASE"/}")
  fi
done < <(root_html_list)

if [ "${#dbg_files[@]}" -gt 0 ]; then
  fail=$((fail+1))
  echo "FAIL: found 'Fix applied' in ${#dbg_files[@]} ROOT page(s):"
  for x in "${dbg_files[@]}"; do echo "  - $x"; done
  echo "Run: ./scripts/tkfm-site-autofix.sh"
else
  echo "OK: no debug text in ROOT pages"
fi
echo

# 4) video-engine style sanity (no nested <style>, balanced tags)
echo "-- CHECK: video-engine.html style tag balance (if exists) --"
if [ -f "$BASE/video-engine.html" ]; then
  open=$(grep -oi '<style' "$BASE/video-engine.html" | wc -l | tr -d ' ')
  close=$(grep -oi '</style>' "$BASE/video-engine.html" | wc -l | tr -d ' ')
  nested=$(awk '
    BEGIN{inStyle=0; bad=0}
    tolower($0) ~ /<style/{ if(inStyle==1) bad=1; inStyle=1 }
    tolower($0) ~ /<\/style>/{ inStyle=0 }
    END{print bad}
  ' "$BASE/video-engine.html" | tr -d ' ')
  if [ "$nested" -eq 1 ]; then
    fail=$((fail+1))
    echo "FAIL: nested <style> detected in video-engine.html"
  elif [ "$open" -ne "$close" ]; then
    fail=$((fail+1))
    echo "FAIL: video-engine.html style tags unbalanced open=$open close=$close"
  else
    echo "OK: video-engine.html styles look sane"
  fi
else
  echo "WARN: video-engine.html not found"
  warn=$((warn+1))
fi
echo

# 5) post-checkout wiring present (if file exists)
echo "-- CHECK: post-checkout.html + deeplink script --"
if [ -f "$BASE/post-checkout.html" ]; then
  if grep -qi 'tkfm-post-checkout-deeplink\.js' "$BASE/post-checkout.html"; then
    echo "OK: post-checkout deeplink script present"
  else
    fail=$((fail+1))
    echo "FAIL: post-checkout.html missing tkfm-post-checkout-deeplink.js"
  fi
else
  echo "WARN: post-checkout.html not found (not fatal)"
  warn=$((warn+1))
fi
echo

echo "RESULT fail=$fail warn=$warn"
[ "$fail" -eq 0 ] || exit 1
