#!/usr/bin/env bash
set -euo pipefail

# TKFM: BOOST REVENUE HEALTHCHECK (files + wiring)
# Usage: ./scripts/tkfm-boost-revenue-healthcheck.sh

pass(){ echo "OK: $1"; }
warn(){ echo "WARN: $1"; }
fail(){ echo "FAIL: $1"; exit 2; }

[ -f netlify/functions/create-checkout-session.js ] && pass "checkout function exists" || fail "missing netlify/functions/create-checkout-session.js"

# boost + featured ecosystem
[ -f netlify/functions/featured-media-track.js ] && pass "tracking function exists" || warn "missing featured-media-track.js"
[ -f js/tkfm-featured-track.js ] && pass "tracker js exists" || warn "missing js/tkfm-featured-track.js"
[ -f js/tkfm-radio-tv-featured.js ] && pass "featured loader exists" || warn "missing js/tkfm-radio-tv-featured.js"

# owner pages (optional)
[ -f owner-paid-lane-inbox.html ] && pass "owner inbox exists" || warn "missing owner-paid-lane-inbox.html"
[ -f owner-boost-dashboard.html ] && pass "owner boost dashboard exists" || warn "missing owner-boost-dashboard.html"
[ -f owner-boost-analytics.html ] && pass "owner boost analytics exists" || warn "missing owner-boost-analytics.html"

# plan ids present somewhere (best-effort)
HIT=0
for f in ./*.html; do
  [ -f "$f" ] || continue
  if grep -q "rotation_boost_7d" "$f"; then pass "found rotation_boost_7d in $(basename "$f")"; HIT=1; fi
  if grep -q "rotation_boost_30d" "$f"; then pass "found rotation_boost_30d in $(basename "$f")"; HIT=1; fi
done
[ "$HIT" -eq 1 ] || warn "did not find rotation_boost_7d/30d in root html files (might be elsewhere)"

echo "DONE"
